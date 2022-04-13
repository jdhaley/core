import {Sequence, Markup} from "../base/model.js";
import {EmptyContent} from "../base/markup";

abstract class MarkupSequence extends EmptyContent implements Sequence<MarkupSequence> {
	[Symbol.iterator](): Iterator<MarkupSequence, any, undefined> {
		return EMPTY_ARRAY[Symbol.iterator]();
	}
	get length(): number {
		return 0;
	}
	at(index: number | string  | Markup): MarkupSequence {
		return undefined;
	}
	indexOf(index: Markup | string, start?: number): number {
		let i = 0;
		for (let content of this) {
			if (typeof index == "string" && index == content.name) return i;
			if (index === content) return i;
		}
		return -1;
	}
	slice(start?: number, end?: number): Sequence<MarkupSequence> {
		throw new Error("Method not implemented.");
	}
	concat(...values: Markup[]): Sequence<MarkupSequence> {
		throw new Error("Method not implemented.");
	}
}

function concat(content: Markup[], values: (Markup | string)[]) {
	content = content.slice();
	for (let value of values) {
		content.push(typeof value == "string" ? new Txt(value) : value);
	}
	return content;
}

class Branch extends MarkupSequence {
	constructor(name: string, content?: Markup[]) {
		super();
		this.#name = name;
		this.#content = content;
	}
	#name: string;
	#content: Markup[];
	
	get name(): string {
		return this.#name;
	}

	get length(): number {
		return this.#content.length;
	}
	// at(index: number | string  | Markup): Markup {
	// 	return typeof index == "number" ? this.#content.at(index) : super.at(index);
	// }
	// slice(start?: number, end?: number): Markup {
	// 	return new Branch(this.name, this.#content.slice(start, end));
	// }
	// concat(...values: (Markup | string)[]): Markup {
	// 	return new Branch(this.name, concat(this.#content, values));
	// }
	// [Symbol.iterator](): Iterator<Markup, any, undefined> {
	// 	return this.#content[Symbol.iterator]();
	// }
}

class Leaf extends Branch {
	constructor(name: string, content: String) {
		super(name, [new Txt(content)]);
	}
}

class Txt extends MarkupSequence {
	constructor(content: String) {
		super();
		this.#content = "" + content;
	}
	#content: string;

	get name() {
		return "#text";
	}
	get textContent(): string {
		return this.#content;
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
	set textContent(content: string) {
		this.#content = "" + content;
	}
}

const EMPTY_ARRAY = Object.freeze([]);
class ELE extends Branch {
	constructor(name: string, content: ELE[]) {
		super(name, content);
	}
	get nodeName() {
		return this.name;
	}
	get innerHTML() {
		return this.markupContent as string;
	}
	set innerHTML(html: string) {
		throw new Error("not implemented");
	}
	get outerHTML() {
		return this.markup;
	}
}

// /** A Strand contains a fixed sequence
// 	The strand's sequence is immutable: the length and at-values are fixed.
// 	This makes it possible to build flyweight sub-strands from a strand.
//  */
// 	interface Strand<T> extends Sequence<T> {
// 	}
	
// 	interface String extends Strand<String> {
// 	}
	
// 	//strings & arrays are implementations of Sequences...
// 	const x: String = "hello";
// 	const y: Sequence<number> = [] as number[];