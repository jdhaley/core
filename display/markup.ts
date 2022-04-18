import {Bundle} from "../api/model.js";
import {EmptyMarkup} from "../base/markup.js";

class NodeModel extends EmptyMarkup {
	constructor(view: Node) {
		super();
		this.#view = view;
	}
	#view: Node
	get name() {
		return this.#view.nodeName.toLowerCase();
	}
	get attr(): Bundle<string> {
		const proxy = proxyAttributes(this, this.#view);
		Reflect.defineProperty(this, "attr", {value: proxy, enumerable: true});
		return proxy;
	}
	get content() {
		const proxy = proxyNodes(this, this.#view);
		Reflect.defineProperty(this, "content", {value: proxy, enumerable: true});
		return proxy;
	}
	get textContent() {
		return this.#view.textContent;
	}
	set textContent(text: string) {
		this.#view.textContent = text;
	}
	get markupContent() {
		return super.markupContent;
	}
	set markupContent(markup: string) {
		if (this.#view.nodeType == Node.ELEMENT_NODE) {
			(this.#view as Element).innerHTML = markup;
		} else if (this.#view.nodeType == Node.TEXT_NODE) {
			let ele = this.#view.ownerDocument.createElement("div");
			ele.innerHTML = markup;
			this.#view.textContent = ele.textContent;
		}
	}
}

const ATTRIBUTES_HANDLER = {
	get(target: Node, name: string) {
		return target instanceof Element ? target.getAttribute(name) : undefined;
	},
	set(target: Node, name: string, value: string) {
		if (target instanceof Element) {
			if (value == undefined) {
				target.removeAttribute(name);
			} else {
				target.setAttribute(name, value);
			}
			return true;
		}
		return false;
	},
	deleteProperty: function(target: Node, name: string) {
		if (target instanceof Element && target.hasAttribute(name)) {
			target.removeAttribute(name);
			return true;
		}
		return false;
	},
	defineProperty() {
		return false;
	},
	getOwnPropertyDescriptor: function(target: Node, name: string) {
		if (target instanceof Element && target.hasAttribute(name)) return {
			value: target.getAttribute(name), 
			writeable: true, 
			enumerable: true,
			configurable: false
		}

		return undefined;
	},
	getPrototypeOf() {
		return null;
	},
	//...etc
}

function proxyAttributes(model: NodeModel, view: Node): Bundle<string> {
	return new Proxy(view, ATTRIBUTES_HANDLER) as any;
}

function proxyNodes(model: NodeModel, view: Node): Iterable<NodeModel> {
	let proxy = Object.create(null);
	proxy[Symbol.iterator] = function*() {
		for (let node of view.childNodes) {
			let content = node["$control"];
			if (!content) {
				content = new NodeModel(node);
				node["$control"] = content;
			}
			yield content;
		}
	}
	return proxy;
}