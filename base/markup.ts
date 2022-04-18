import {Bundle, Markup} from "../api/model.js";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze(Object.create(null));

export type content = string | Markup;

export class EmptyMarkup implements Markup {
	protected get value(): string {
		return undefined;
	}
	get name(): string {
		return typeof this.value == "string" ? "#text" : "markup";
	}
	get attr(): Bundle<string> {
		return EMPTY_OBJECT;
	}
	get content(): Iterable<Markup> {
		return EMPTY_ARRAY;
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

function toMarkup(...values: content[]): Markup[] {
	let content: Markup[] = []
	for (let value of values) {
		if (typeof value == "string") value = new TextContent(value);
		content.push(value);
	}
	return content;
}

function markupAttrs(attrs: Bundle<string>) {
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