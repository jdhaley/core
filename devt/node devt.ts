import {Markup, Array, Bundle} from "../base/model.js";
import {EmptyMarkup} from "../base/content";

const IMMUTABLE_ARRAY = {
	set() {
		throw new Error("Immutable Array");
	}
}

class MarkupNode extends EmptyMarkup {
	constructor(name: string) {
		super();
		this.#name = name;
		if (this.isNamed) {
			let childNodes: MarkupNode[] = [];
			this.#content = childNodes;
			this.childNodes = new Proxy(childNodes, IMMUTABLE_ARRAY);
		} else {
			this.#content = "";
			this.childNodes = new Proxy(EMPTY_ARRAY as MarkupNode[], IMMUTABLE_ARRAY);
		}
	}
	#name: string
	#content: string | MarkupNode[];
	readonly childNodes: Array<MarkupNode>;
	get name(): string {
		return this.#name;
	}
	get nodeName(): string {
		return this.#name;
	}
	get nodeType(): number {
		switch (this.name) {
			case "#document": return Node.DOCUMENT_NODE;
			case "#text": return Node.TEXT_NODE;
			case "#comment": return Node.COMMENT_NODE;
			default: return Node.ELEMENT_NODE;
		}
	}
	// previousSibling: Node;
	// nextSibling: Node;
	// parentNode: Node;
	// ownerDocument: Node;
}

class Element extends MarkupNode {
	#nodes: MarkupNode[] = [];
	#attributes: Bundle<string> = Object.create(null);

	firstChild: Node;
	lastChild: Node;
	id: string;
	className: string;
	innerHTML: string;
	// getAttribute(name: string): string;
	// setAttribute(name: string, value: string): void;
	// removeAttribute(name: string): void;
	// append(value: string | Node): void;
}

interface Document {
	//createElementNS(namespace, name);
	createElement(name: string): Element;
	createTextNode(): Node;
}



function concat(content: Markup[], values: (Markup | string)[]) {
	content = content.slice();
	for (let value of values) {
		content.push(typeof value == "string" ? new Txt(value) : value);
	}
	return content;
}

class Branch extends EmptyMarkup {
	constructor(name: string, content?: Markup[]) {
		super();
		this.#name = name;
		this.#content = content;
	}
	#name: string;
	#content: Markup[];
	
	get name(): string {
		return this.#name;
	}

	get length(): number {
		return this.#content.length;
	}
	// at(index: number | string  | Markup): Markup {
	// 	return typeof index == "number" ? this.#content.at(index) : super.at(index);
	// }
	// slice(start?: number, end?: number): Markup {
	// 	return new Branch(this.name, this.#content.slice(start, end));
	// }
	// concat(...values: (Markup | string)[]): Markup {
	// 	return new Branch(this.name, concat(this.#content, values));
	// }
	// [Symbol.iterator](): Iterator<Markup, any, undefined> {
	// 	return this.#content[Symbol.iterator]();
	// }
}

class Leaf extends Branch {
	constructor(name: string, content: String) {
		super(name, [new Txt(content)]);
	}
}

class Txt extends EmptyMarkup {
	constructor(content: String) {
		super();
		this.#content = "" + content;
	}
	
	#content: string;

	get name() {
		return "#text";
	}
	get textContent(): string {
		return this.#content;
	}
	get markupContent(): string {
		let markup = "";
		for (let ch of this.textContent) {
			switch (ch) {
				case ">": markup += "&gt;"; break;
				case "<": markup += "&lt;"; break;
				case "&": markup += "&amp;"; break;
				default:  markup += ch; break;
			}
		}
		return markup;
	}
	set textContent(content: string) {
		this.#content = "" + content;
	}
}

const EMPTY_ARRAY = Object.freeze([]);
class ELE extends Branch {
	constructor(name: string, content: ELE[]) {
		super(name, content);
	}
	get nodeName() {
		return this.name;
	}
	get innerHTML() {
		return this.markupContent as string;
	}
	set innerHTML(html: string) {
		throw new Error("not implemented");
	}
	get outerHTML() {
		return this.markup;
	}
}
