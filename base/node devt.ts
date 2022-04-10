import {Strand} from "./bag";

//strings & arrays are implementations of Strands...
const x: String = "hello";
const y: Strand<number> = [] as number[];

interface String extends Strand<string> {
}

interface Markup extends Strand<Markup> {
	name: String;
	markup: String;
	markupContent: String;
	textContent: String;

	at(index: number | String  | Markup): Markup;
	/** when the search is a string, it returns the first child with the string name. */
	indexOf(search: Markup | String, start?: number): number;

	//content: Strand<Markup>;
	//The advantage of Markup is-a Strand is we get another Markup instead of a Strand here...

	// readonly length: number,
	// at(index: number): Markup,
	// indexOf(search: Markup | string, start?: number): number,
	// slice(start?: number, end?: number): Markup,
	// concat(...values: (Markup | string)[]): Markup
}

class Abstr implements Markup {
	constructor(name: string) {
		this.#name = name.toLowerCase();
	}
	#name: string;
	
	get name(): string {
		return this.#name;
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

	/* Strand */

	[Symbol.iterator](): Iterator<Markup, any, undefined> {
		return EMPTY_ARRAY[Symbol.iterator]();
	}
	get length(): number {
		return 0;
	}
	at(index: number | string  | Markup): Markup {
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
	slice(start?: number, end?: number): Markup {
		return new Branch(this.#name, EMPTY_ARRAY as Markup[]);
	}
	concat(...values: (Markup | string)[]): Markup {
		return new Branch(this.name, concat(EMPTY_ARRAY as Markup[], values));
	}
}

function concat(content: Markup[], values: (Markup | string)[]) {
	content = content.slice();
	for (let value of values) {
		content.push(typeof value == "string" ? new Text(value) : value);
	}
	return content;
}
class Branch extends Abstr {
	constructor(name: string, content?: Markup[]) {
		super(name);
		this.#content = content;
	}
	#content: Markup[];

	get length(): number {
		return this.#content.length;
	}
	at(index: number | string  | Markup): Markup {
		return typeof index == "number" ? this.#content.at(index) : super.at(index);
	}
	slice(start?: number, end?: number): Markup {
		return new Branch(this.name, this.#content.slice(start, end));
	}
	concat(...values: (Markup | string)[]): Markup {
		return new Branch(this.name, concat(this.#content, values));
	}
	[Symbol.iterator](): Iterator<Markup, any, undefined> {
		return this.#content[Symbol.iterator]();
	}
}

class Leaf extends Abstr {
	constructor(name: string, content: String) {
		super(name);
		this.#content = "" + content;
	}
	#content: string;
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
}

class Text extends Leaf {
	constructor(content: string) {
		super("#text", content);
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