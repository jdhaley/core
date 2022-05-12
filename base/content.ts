import {Content, Consumer, Sequence} from "../api/model.js";

import {markupAttrs, markupContent, markupText} from "./markup.js";
import { EMPTY } from "./util.js";

export class EmptyContent implements Content {
	get name(): string {
		return "";
	}
	get content(): Iterable<Content> {
		return EMPTY.array;
	}
	get textContent(): string {
		return "";
	}
	get markup(): string {
		let markup = this.markupContent;
		let attrs = markupAttrs(this)
		if (this.isNamed) {
			markup = `<${this.name}${attrs}>${markup}</${this.name}>`
		}
		return markup;
	}
	get markupContent(): string {
		return "";
	}
	protected get isNamed(): boolean {
		return this.name.startsWith("#") ? false : true;
	}
	at(name: string): string {
		return undefined;
	}
	keys(): Iterable<string> {
		return EMPTY.array;
	}
}

export class TextContent extends EmptyContent {
	constructor(text: string) {
		super();
		this.textContent = text;
	}
	#value: string
	get name(): string {
		return "#text";
	}
	get textContent(): string {
		return this.#value;
	}
	set textContent(text: string) {
		this.#value = text;
	}
	get markupContent(): string {
		return markupText(this.#value);
	}
}

export class Bag extends EmptyContent implements Consumer<string | Content> {
	#content: Content[] = [];

	get content(): Sequence<Content> {
		return this.#content;
	}
	get markupContent(): string {
		return markupContent(this.#content);
	}
	get textContent(): string {
		let text = "";
		for (let item of this.content) text += item.textContent;
		return text;	
	}
	set textContent(text: string) {
		this.#content.length = 0;
		this.append(new TextContent(text));
	}
	append(...values: (string | Content)[]): void {
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

export class SourceContent extends Bag {
	error?: string;
	parse(text: string, start: number): number {
		this.append(new TextContent(text.substring(start)));
		return text.length;
	}
}
