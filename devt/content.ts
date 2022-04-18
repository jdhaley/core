import {Markup, Sequence} from "../api/model.js";
import {EmptyMarkup} from "../base/markup.js";

const EMPTY_ARRAY = Object.freeze([]);

type content = string | MarkupSequence;

export abstract class MarkupSequence extends EmptyMarkup implements Sequence<MarkupSequence> {
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
	get content(): Sequence<MarkupSequence> {
		return EMPTY_ARRAY;
	}
	[Symbol.iterator](): Iterator<MarkupSequence, any, undefined> {
		return this.content[Symbol.iterator]();
	}
	get length(): number {
		return this.content.length;
	}
	at(key: number | content): MarkupSequence {
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
	slice(start?: number, end?: number): MarkupSequence {
		return this.create(...this.content.slice(start, end));
	}
	concat(...values: content[]): MarkupSequence {
		return this.create(...this.content, ...values);
	}
	protected create(...values: content[]): MarkupSequence {
		let constr = Object.getPrototypeOf(this).constructor;
		return new constr(toContent(...values));
	}
}

export class TextContent extends MarkupSequence {
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

function toContent(...values: content[]): MarkupSequence[] {
	let content: MarkupSequence[] = []
	for (let value of values) {
		if (typeof value == "string") value = new TextContent(value);
		content.push(value);
	}
	return content;
}