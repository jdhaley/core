import {Control, Transmitter} from "../../core/base/control.js";
import {Actions, Part, Receiver} from "../../core/base/core.js";
import {Remote} from "./remote.js";
import util from "../../core/base/util.js";

interface Whole extends Receiver, Transmitter {
	origin: Remote;
	location: Location;
	part: Part;
}

export class Owner extends Control implements Whole {
	static of(node: Node | Range): Owner {
		if (node instanceof Range) node = node.commonAncestorContainer;
		return node?.ownerDocument["owner"];
	}
	origin = new Remote();
	#lastId: number = 0;
	constructor(actions: Actions) {
		super(actions);
	}
	get document(): Document {
		return null;
	}
	get part(): Viewer {
		return this.document.documentElement["$control"];
	}
	get parts() {
		let control = this.part;
		let decl = {
			value: {
				[Symbol.iterator]: function*() {
					yield control;
				}
			}
		}
		Reflect.defineProperty(this, "parts", decl);
		return decl.value;
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
	createId() {
		return ++this.#lastId;
	}
	getId(ele: Element): string {
		if (ele.nodeType != Node.ELEMENT_NODE) ele = ele.parentElement;
		if (ele && !ele.id) {
			ele.id = "" + this.createId();
		}
		return ele ? ele.id : "";
	}
	getFileName(contextPath?: string, extension?: string) {
		if (!this.location.search) {
			this.location.search = util.formatDate(new Date());
			// this.location.search = `${contextPath}/${util.formatDate(new Date())}.${extension}`;
			return;
		}
		let name = this.location.search.substring(1); //strip the leading "?"
		if (contextPath) name = contextPath + "/" + name;
		if (extension) name += "." + extension;
		return name;
	}
	viewerOf(node: Node): Viewer {
		while(node) {
			let control = node["$control"];
			if (control) return control;
			node = node.parentNode;
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
	markup(range: Range): string {
		let frag = range.cloneContents();
		let div = range.commonAncestorContainer.ownerDocument.createElement("div");
		while (frag.firstChild) {
			div.append(frag.firstChild);
		}
		return div.innerHTML;
	}
	append(control: Viewer) {
		//cast to any to access the protected view.
		this.document.body.append((control as any).view);
	}
}

export class Viewer extends Control {
	protected model: any;
	protected view: Element;
	constructor(owner: Owner, conf: any, ele?: Element) {
		super(conf?.actions);
		if (!ele) ele = owner.createElement(conf.nodeName || "div");
		ele["$control"] = this;
		this.view = ele;
	}
	get owner(): Owner {
		return Owner.of(this.view);
	}
	get partOf() {
		return this.view.parentNode["$control"];
	}
	get parts() {
		let x: ChildNode;
		const nodes = this.view.childNodes;
		let to = Object.create(null);
		to[Symbol.iterator] = function*() {
			for (let i = 0, len = nodes.length; i < len; i++) {
				let node = nodes[i];
				if (node["$control"]) yield node["$control"];
			}
		}
		Reflect.defineProperty(this, "parts", {
			value: to
		});
		return to;
	}
	get markup() {
		return this.view.innerHTML;
	}
	set markup(markup: string) {
		this.view.innerHTML = markup;
	}
	append(control: Viewer) {
		this.view.append(control.view);
	}
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


	//monitor(this.view);

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
	
	