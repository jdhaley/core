import {Markup, Sequence} from "../base/model.js";

const EMPTY_ARRAY = Object.freeze([]);

export class EmptyMarkup implements Markup {
	[Symbol.iterator](): Iterator<Markup, any, undefined> {
		return EMPTY_ARRAY[Symbol.iterator]();
	}
	get type(): string /*| LiteralType */ {
		return this.name.startsWith("#") ? this.name.substring(1) : "any";
	}
	get name(): string {
		return "#text"
	}
	get markup(): string {
		let markup = this.markupContent;
		if (!this.name.startsWith("#")) {
			markup = `<${this.name}>${markup}</${this.name}>`
		}
		return markup;
	}
	get markupContent(): string {
		let markup = "";
		for (let content of this) markup += content.markup;
		return markup;
	}
	get textContent(): string {
		let text = "";
		for (let content of this) text += content.textContent;
		return text;
	}
}

// /* devt - currently unsupported */
// interface MarkupElement extends Markup {
// 	attributes?: Bundle<string>
// 	children: Sequence<MarkupElement>
// }

export class Content extends EmptyMarkup implements Sequence<Content> {
	constructor(content?: Sequence<Content>) {
		super();
		this.#content = content || EMPTY_ARRAY as Content[];
	}
	#content: Sequence<Content>;
	[Symbol.iterator](): Iterator<Content, any, undefined> {
		return this.#content[Symbol.iterator]();
	}
	get length(): number {
		return this.#content.length;
	}
	at(key: number | string | Content): Content {
		if (typeof key != "number") key = this.indexOf(key);
		return this.#content.at(key);
	}
	indexOf(search: string | Content, start?: number): number {
		if (typeof search == "string") {
			for (let i = start || 0; i < this.length; i++) {
				let content = this.at(i);
				if (search === content.name) {
					return i;
				}
			}
			return -1;
		}
		return this.#content.indexOf(search, start);
	}
	slice(start?: number, end?: number): Content {
		return new NamedMarkupContent(this.name, this.#content.slice(start, end));
	}
	concat(...values: (string | Content)[]): Content {
		let content: Content[] = []
		for (let value of values) {
			if (typeof value == "string") value = new TextContent(value);
			content.push(value);
		}
		return new NamedMarkupContent(this.name, this.#content.concat(...content));
	}
	protected get content() {
		return this.#content;
	}
}
export class MutableContent extends Content {
	constructor() {
		let content = [] as Content[];
		super(content);
	}
	//NOTE: Add is safe from a flyweight Sequence viewpoint (add wont alter existing subsequences, nice.)
	add(content: Content): void {
		(this.content as Content[]).push(content);
	}
	//TODO: Remove clear, see above.
	protected clear(): void {
		(this.content as Content[]).length = 0;
	}
}
// class xxxMarkupContent extends MarkupContent {
// 	//NOTE: Add is safe from a flyweight Sequence viewpoint (add wont alter existing subsequences, nice.)
// 	add(content: Content): void {
// 		this.#content.push(content);
// 	}
// 	//TODO: Remove clear, see above.
// 	protected clear(): void {
// 		this.#content.length = 0;
// 	}
	
// 	//Sequence:

// 	indexOf(search: Content, start?: number): number {
// 		return this.#content.indexOf(search, start);
// 	}
// 	slice(start?: number, end?: number): MarkupContent {
// 		return new NamedMarkupContent(this.name, this.#content.slice(start, end));
// 	}
// 	concat(...values: (string | Markup)[]): MarkupContent {
// 		for (let i = 0; i < values.length; i++) {
// 			let value = values[i];
// 			if (typeof value == "string") values[i] = new TextContent(value);
// 		}
// 		return new NamedMarkupContent(this.name, this.#content.concat(values as Content[]));
// 	}
// }
export class TextContent extends Content {
	constructor(text?: string) {
		super();
		this.#textContent = "" + text;
	}
	#textContent: string;
	get name(): string {
		return "#text"
	}
	get textContent(): string {
		return this.#textContent;
	}
	set textContent(text: string) {
		this.#textContent = text;
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
}

class NamedMarkupContent extends Content {
	constructor(name: string, content?: Sequence<Content>) {
		super(content);
		this.#name = name;
	}
	#name: string
	get name(): string {
		return this.#name;
	}
}

export class NamedTextContent extends TextContent {
	constructor(name: string, text?: string) {
		super(text);
		this.#name = name;
	}
	#name: string
	get name(): string {
		return this.#name;
	}
}
