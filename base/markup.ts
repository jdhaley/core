import {Markup, Sequence, Buffer} from "../base/model.js";

const EMPTY_ARRAY = Object.freeze([]);

export class EmptyMarkup implements Markup {
	[Symbol.iterator](): Iterator<Markup, any, undefined> {
		return EMPTY_ARRAY[Symbol.iterator]();
	}
	get typeName(): string /*| LiteralType */ {
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

export class Content extends EmptyMarkup implements Sequence<Content> {
	constructor(content?: Sequence<Content>) {
		super();
		this.#content = content || EMPTY_ARRAY as Content[];
	}
	#content: Sequence<Content>;
	[Symbol.iterator](): Iterator<Content, any, undefined> {
		return this.content[Symbol.iterator]();
	}
	get length(): number {
		return this.content.length;
	}
	at(key: number | string | Content): Content {
		if (typeof key != "number") key = this.indexOf(key);
		return this.content.at(key);
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
		return this.content.indexOf(search, start);
	}
	slice(start?: number, end?: number): Content {
		return new NamedContent(this.name, this.content.slice(start, end));
	}
	concat(...values: (string | Content)[]): Content {
		let content: Content[] = []
		for (let value of values) {
			if (typeof value == "string") value = new TextContent(value);
			content.push(value);
		}
		return new NamedContent(this.name, this.content.concat(...content));
	}
	protected get content() {
		return this.#content;
	}
}

class NamedContent extends Content {
	constructor(name: string, content?: Sequence<Content>) {
		super(content);
		this.#name = name;
	}
	#name: string
	get name(): string {
		return this.#name;
	}
}

export class Bag extends Content implements Buffer<Content> {
	constructor() {
		let content = [] as Content[];
		super(content);
	}
	get children(): Content[] {
		return this.content as Content[];
	}
	//Note: Should really have to override, is it a TS issue?
	get textContent(): string {
		return super.textContent;
	}
	set textContent(text: string) {
		this.clear();
		this.add(new TextContent(text));
	}
	get isClosed(): boolean  {
		return Object.isFrozen(this.content);
	}
	append(...values: Content[]): void {
		for (let value of values) {
			//TODO make values "any" (or "string | Content")
			this.children.push(value);
		}
	}
	add(content: Content): void {
		this.children.push(content);
	}
	clear(): void {
		this.children.length = 0;
	}
	close(): void {
		Object.freeze(this.content);
	}
	parse(source: string, start: number): number {
		this.add(new TextContent(source.substring(start)));
		return source.length;
	}
}

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
