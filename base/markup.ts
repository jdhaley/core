import {Markup, Sequence} from "../base/model.js";

const EMPTY_ARRAY = Object.freeze([]);

export class EmptyContent implements Markup {
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
		return this.name.startsWith("#") 
			? this.markupContent
			: `<${this.name}>${this.markupContent}</${this.name}>`
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

export class MarkupContent extends EmptyContent implements Sequence<Markup> {
	constructor(content?: Markup[]) {
		super();
		this.#content = content;
	}
	#content: Markup[];
	[Symbol.iterator](): Iterator<Markup, any, undefined> {
		return this.#content[Symbol.iterator]();
	}
	get length(): number {
		return this.#content.length;
	}
	//NOTE: Add is safe from a flyweight Sequence viewpoint (add wont alter existing subsequences, nice.)
	add(content: Markup): void {
		this.#content.push(content);
	}
	//TODO: Remove clear, see above.
	protected clear(): void {
		this.#content.length = 0;
	}
	//Sequence:
	at(key: number): Markup {
		return this.#content.at(key);
	}
	indexOf(search: Markup, start?: number): number {
		return this.#content.indexOf(search, start);
	}
	//NOTE: to support returning Markup for slice & concat, we need the name (at minimum) to be a data property.
	slice(start?: number, end?: number): Sequence<Markup> {
		return this.#content.slice(start, end);
	}
	concat(...values: Markup[]): Sequence<Markup> {
		return this.#content.concat(values);
	}
}

export class TextContent extends EmptyContent {
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
}