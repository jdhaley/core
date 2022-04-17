import {Markup, Bundle} from "../api/model.js";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze(Object.create(null));

/** A Sequence provides an ordinal (positional) collection of values.
	There are no contracts on the mutability of the sequence.
	Native strings and Arrays are assignable to Sequence.
*/
export interface Sequence<T> extends Iterable<T> {
	get length(): number;
	at(key: number): T;
	indexOf(search: T, start?: number): number;
	slice(start?: number, end?: number): Sequence<T>;
	concat(...values: T[]): Sequence<T>;
}

export class EmptyMarkup implements Markup {
	get content(): Iterable<Markup> {
		return EMPTY_ARRAY;
	}
	protected get value(): string {
		return "";
	}
	get name(): string {
		return typeof this.value == "string" ? "#text" : "markup";
	}
	get attributes(): Bundle<string> {
		return EMPTY_OBJECT;
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

export type content = string | Content;

export abstract class Content extends EmptyMarkup implements Sequence<Content> {
	// constructor(content: string | Sequence<Content>) {
	// 	super();
	// 	this.#value = content;
	// }
	// #value: string | Sequence<Content>;
	// protected get value(): string {
	// 	return typeof this.#value == "string"  ? this.#value : "";
	// }
	// protected get content(): Sequence<Content> {
	// 	return typeof this.#value == "string" ? EMPTY_ARRAY : this.#value;
	// }
	///////////
	get content(): Sequence<Content> {
		return EMPTY_ARRAY;
	}
	[Symbol.iterator](): Iterator<Content, any, undefined> {
		return this.content[Symbol.iterator]();
	}
	get length(): number {
		return this.content.length;
	}
	at(key: number | content): Content {
		if (typeof key != "number") key = this.indexOf(key);
		return this.content.at(key);	
	}
	indexOf(search: content, start?: number): number {
		if (typeof search == "string") {
			for (let i = start || 0; i < this.length; i++) {
				let content = this.at(i);
				if (search === content.name) {
					return i;
				}
			}
			return -1;
		} else {
			return this.content.indexOf(search, start);
		}
	}
	slice(start?: number, end?: number): Content {
		return this.create(...this.content.slice(start, end));
	}
	concat(...values: content[]): Content {
		return this.create(...this.content, ...values);
	}
	protected create(...values: content[]): Content {
		let constr = Object.getPrototypeOf(this).constructor;
		return new constr(toContent(...values));
	}
}

export class TextContent extends Content {
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

function toContent(...values: content[]): Content[] {
	let content: Content[] = []
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