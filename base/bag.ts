import {Bundle, Markup, content} from "../api/model.js";
import {Consumer} from "../api/resource.js";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze(Object.create(null));

export class EmptyMarkup implements Markup {
	protected get value(): string {
		return undefined;
	}
	get name(): string {
		return typeof this.value == "string" ? "#text" : "markup";
	}
	get attributes(): Bundle<string> {
		return EMPTY_OBJECT;
	}
	get content(): Iterable<Markup> {
		return EMPTY_ARRAY;
	}
	get markup(): string {
		let markup = this.markupContent;
		if (this.isNamed) {
			markup = `<${this.name}>${markup}</${this.name}>`
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

function markupText(text: string): string {
	let markup = "";
	for (let ch of text) {
		switch (ch) {
			case ">": markup += "&gt;"; break;
			case "<": markup += "&lt;"; break;
			case "&": markup += "&amp;"; break;
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

const IMMUTABLE_ARRAY = {
	set() {
		throw new Error("Immutable Array");
	}
}

export class Bag extends EmptyMarkup implements Consumer<content> {
	// constructor() {
	// 	super();
	// 	//create an immutable proxy for "content", overridding the TS/class inheritence
	// 	//Object.defineProperty(this, "content", {value: new Proxy(this.#content, IMMUTABLE_ARRAY)})
	// }
	#content: Markup[] = [];
	get content(): Markup[] {
		return this.#content;
	}
	get textContent(): string {
		return super.textContent;
	}
	set textContent(text: string) {
		this.clear();
		this.append(new TextContent(text));
	}
	append(...values: content[]): void {
		for (let value of values) {
			this.#content.push(typeof value == "string" ? new TextContent(value) : value);
		}
	}
	clear(): void {
		this.#content.length = 0;
	}
	parse(source: string, start: number): number {
		this.append(new TextContent(source.substring(start)));
		return source.length;
	}
}
