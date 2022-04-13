import {Markup} from "../base/model.js";

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

export class MarkupContent extends EmptyContent {
	constructor(content?: Markup[]) {
		super();
		this.#content = content;
	}
	#content: Markup[];
	[Symbol.iterator](): Iterator<Markup, any, undefined> {
		return this.#content[Symbol.iterator]();
	}
	add(content: Markup): void {
		this.#content.push(content);
	}
	clear(): void {
		this.#content.length = 0;
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