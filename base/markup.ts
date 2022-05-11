import {Consumer, Entity, Markup, Sequence} from "../api/model.js";
import {bundle, EMPTY} from "../api/util.js";

export type content = string | Markup;

export class ElementMarkup<T extends Markup> implements Markup {
	constructor(parent?: T) {
		this.partOf = parent;
	}
	protected element: Element;

	protected readonly partOf: T;
	content: T[];

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

	at(name: string): string {
		return this.element.getAttribute(name);
	}
	// //add put()
	// protected get isNamed(): boolean {
	// 	return this.name.startsWith("#") ? false : true;
	// }
	// get attributes(): bundle<string> {
	// 	//TODO return a proxy so that the attributes are live.
	// 	return Array
	// 		.from(this.element.attributes)
    // 		.filter(a => a.specified)
    // 		.map(a => ({[a.nodeName]: a.nodeValue}))
    // 		.reduce((prev, curr) => Object.assign(prev || Object.create(null), curr))
	// }
}

export class EmptyMarkup implements Markup, Entity {
	protected get attr(): bundle<string> {
		return EMPTY.object;
	}
	protected get value(): string {
		return undefined;
	}
	get name(): string {
		return typeof this.value == "string" ? "#text" : "markup";
	}
	get content(): Iterable<Markup> {
		return EMPTY.array;
	}
	get markup(): string {
		let markup = this.markupContent;
		if (this.isNamed) {
			markup = `<${this.name}${markupAttrs(this.attr)}>${markup}</${this.name}>`
		}
		return markup;
	}
	get markupContent(): string {
		if (this.isNamed) return markupContent(this.content)
		return markupText(this.value);
	}
	get textContent(): string {
		if (this.isNamed) {
			let text = "";
			for (let item of this.content) text += item.textContent;
			return text;	
		}
		return this.value;
	}
	protected get isNamed(): boolean {
		return this.name.startsWith("#") ? false : true;
	}

	at(name: string): string {
		return undefined;
	}
}

export class TextContent extends EmptyMarkup {
	constructor(text: string) {
		super();
		this.textContent = text;
	}
	#value: string
	protected get value(): string {
		return this.#value;
	}
	get textContent(): string {
		return this.#value;
	}
	set textContent(text: string) {
		this.#value = text;
	}	
}


export class Bag extends EmptyMarkup implements Consumer<Markup> {
	#content: Markup[] = [];
	get content(): Sequence<Markup> {
		return this.#content;
	}
	get textContent(): string {
		return super.textContent;
	}
	set textContent(text: string) {
		this.#content.length = 0;
		this.append(new TextContent(text));
	}
	append(...values: content[]): void {
		for (let value of values) {
			this.#content.push(typeof value == "string" ? new TextContent(value) : value);
		}
	}
	empty() {
		this.#content.length = 0;
	}
	get isClosed(): boolean {
		return Object.isFrozen(this.content);
	}
	close(): void {
		Object.freeze(this.content);
	}
}


function toMarkup(...values: content[]): Markup[] {
	let content: Markup[] = []
	for (let value of values) {
		if (typeof value == "string") value = new TextContent(value);
		content.push(value);
	}
	return content;
}

function markupAttrs(attrs: bundle<string>) {
	let markup = "";
	for (let key in attrs) {
		markup += ` ${key}="${markupText(attrs[key], true)}"`;
	}
	return markup;
}

function markupText(text: string, quote?: boolean): string {
	let markup = "";
	for (let ch of text) {
		switch (ch) {
			case ">": markup += "&gt;"; break;
			case "<": markup += "&lt;"; break;
			case "&": markup += "&amp;"; break;
			case "\"": markup += quote ? "&quot;" : ch; break;
			default:  markup += ch; break;
		}
	}
	return markup;			
}

function markupContent(content: Iterable<Markup>): string {
	let markup = "";
	for (let item of content) markup += item.markup;
	return markup;
}