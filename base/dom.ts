import {Content} from "../api/model.js";
import {Transmitter} from "../api/signal.js";
import {Control, Owner} from "./control.js";

export class ControlElement extends Control implements Content {
	protected get element(): Element {
		return null;
	}
	get service(): Transmitter {
		return this.partOf?.service;
	}
	get name() {
		return this.element.nodeName;
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
		return this.element.parentNode["$control"];
	}
	get content(): Iterable<ControlElement> {
		const nodes = this.element.childNodes;
		let to = Object.create(null);
		to[Symbol.iterator] = function*() {
			for (let i = 0, len = nodes.length; i < len; i++) {
				let node = nodes[i];
				if (node["$control"]) yield node["$control"];
			}
		}
		Reflect.defineProperty(this, "content", {
			value: to
		});
		return to;
	}

	at(name: string): string {
		return this.element.getAttribute(name);
	}
	put(name: string, value: string) {
		this.element.setAttribute(name, value);
	}
	append(control: ControlElement) {
		this.element.append(control.element);
	}
}

export class DocumentOwner extends Owner {
	static of(node: Node | Range): DocumentOwner {
		if (node instanceof Range) node = node.commonAncestorContainer;
		return node?.ownerDocument["owner"];
	}

	get document(): Document {
		return null;
	}
	get location() {
		return this.document.location;
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

export function controlOf(node: Node): ControlElement {
	while(node) {
		let control = node["$control"];
		if (control) return control;
		node = node.parentNode;
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

