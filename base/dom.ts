import {Content} from "../api/model.js";
import {Controller, Transmitter} from "../api/signal.js";
import {Control, ControlConf, Owner} from "./control.js";
import { EMPTY } from "./util.js";

export class ControlElement extends Control implements Content {
	protected get element(): Element {
		return null;
	}
	get owner() {
		return ownerOf(this.element);
	}
	get service(): Transmitter {
		return this.partOf?.service;
	}
	get name() {
		return this.element.tagName;
	}
	get markup(): string {
		return this.element.outerHTML;
	}
	get markupContent(): string {
		return this.element.innerHTML;
	}
	set markupContent(content: string) {
		this.element.innerHTML = content;
	}
	get textContent(): string {
		return this.element.textContent;
	}
	set textContent(content: string) {
		this.element.textContent = content;
	}
	get partOf(): ControlElement {
		for (let parent = this.element.parentElement; parent; parent = parent.parentElement) {
			if (parent["$control"]) return parent["$control"];
		}
		return null;
	}
	get content(): Iterable<ControlElement> {
		const nodes = this.element.childNodes;
		let content = Object.create(null);
		content[Symbol.iterator] = function*() {
			for (let i = 0, len = nodes.length; i < len; i++) {
				let node = nodes[i];
				if (node["$control"]) yield node["$control"];
			}
		}
		Reflect.defineProperty(this, "content", {
			value: content
		});
		return content;
	}

	attributeNames() {
		return this.element.getAttributeNames();
	}
	at(name: string): string {
		return this.element.getAttribute(name);
	}
	put(name: string, value: string) {
		this.element.setAttribute(name, value);
	}
	append(...values: ControlElement[]): void {
		for (let value of values) {
			this.element.append(value.element);
		}
	}
}


export class DocumentControl extends ControlElement {
	constructor(owner: DocumentOwner, conf: ControlConf) {
		super(owner, conf);
		let ele = owner.createElement(conf.name || conf.type || "div");
		ele["$control"] = this;
		ele["$controller"] = conf.controller || EMPTY.object;
		this.#element = ele;
	}
	#element: Element;

	protected get element() {
		return this.#element;
	}
	get controller(): Controller {
		return this.#element["$controller"];
	}
}

export class DocumentOwner extends Owner {
	get document(): Document {
		return null;
	}
	get location() {
		return this.document.location;
	}

	create(conf: string | ControlConf, parent?: Element): ControlElement {
		let control = super.create(conf) as ControlElement;
		if (parent) parent.append(control["element"]);
		return control;
	}
	createElement(name: string, namespace?: string): Element {
		if (namespace) {
			return this.document.createElementNS(namespace, name);
		} else {
			return this.document.createElement(name);
		}
	}
	createNodes(source: string | Range): Node[] {
		let list: NodeList;
		if (typeof source == "string") {
			let div = this.document.createElement("div");
			div.innerHTML = source;
			list = div.childNodes;
		} else if (source instanceof Range) {
			let frag = source.cloneContents();
			list = frag.childNodes;
		}
		let nodes = [];
		for (let node of list) {
			//Chrome adds a meta tag for UTF8 when the cliboard is just text.
			//TODO a more generalized transformation to be developed for all clipboard exchange.
			if (node.nodeName != "META") nodes.push(node);
		}
		return nodes;
	}
}

export function ownerOf(node: Node | Range): DocumentOwner {
	if (node instanceof Range) node = node.commonAncestorContainer;
	return node?.ownerDocument["$owner"];
}

export function controlOf(node: EventTarget | Range): ControlElement {
	if (node instanceof Range) node = node.commonAncestorContainer;
	while (node) {
		let control = node["$control"];
		if (control) return control;
		node = (node as Node).parentNode;
	}
}
export function markup(range: Range): string {
	let frag = range.cloneContents();
	let div = range.commonAncestorContainer.ownerDocument.createElement("div");
	while (frag.firstChild) {
		div.append(frag.firstChild);
	}
	return div.innerHTML;
}

export const text = {
	priorText(node: Node) {
		let parent = node.parentNode;
		for (node = node.previousSibling; node; node = node.previousSibling) {
			if (node.nodeType == Node.TEXT_NODE) return node;
			if (node.nodeType == Node.ELEMENT_NODE) {
				let text = this.lastText(node);
				if (text) return text;
			}
		}
		return parent ? this.priorText(parent) : null;
	},
	nextText(node: Node) {
		let parent = node.parentNode;
		for (node = node.nextSibling; node; node = node.nextSibling) {
			if (node.nodeType == node.TEXT_NODE) return node;
			if (node.nodeType == Node.ELEMENT_NODE) {
				let text = this.firstText(node);
				if (text) return text;
			}
		}
		return parent ? this.nextText(parent) : null;
	},
	firstText(node: Node) {
		for (node = node.firstChild; node; node = node.nextSibling) {
			if (node.nodeType == node.TEXT_NODE) return node;
			if (node.nodeType == Node.ELEMENT_NODE) {
				let text = this.firstText(node);
				if (text) return text;
			}
		}
	},
	lastText(node: Node) {
		for (node = node.lastChild; node; node = node.previousSibling) {
			if (node.nodeType == node.TEXT_NODE) return node;
			if (node.nodeType == Node.ELEMENT_NODE) {
				let text = this.lastText(node);
				if (text) return text;
			}
		}
	}
}

//monitor(this.element);
function monitor(article: Element) {
	// Options for the observer (which mutations to observe)
	const config = { subtree: true, characterData: true};

	// Callback function to execute when mutations are observed
	const callback = function(mutationsList, observer) {
		article["$changed"] = true;
		console.log(mutationsList);
		// // Use traditional 'for loops' for IE 11
		// for(const mutation of mutationsList) {
		// 	if (mutation.type === 'childList') {
		// 		console.log('A child node has been added or removed.');
		// 	}
		// 	else if (mutation.type === 'attributes') {
		// 		console.log('The ' + mutation.attributeName + ' attribute was modified.');
		// 	}
		// }
	};

	// Create an observer instance linked to the callback function
	const observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(article, config);
}

