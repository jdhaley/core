import {Aggregate, Container, Type, Bag} from "./model.js";
import { Receiver, Signal } from "./signal.js";

abstract class X<T> implements Bag<T> {
	type: Type;
	pure: any;
	keys: Iterable<string | number>;
	get isClosed(): boolean {
		return Object.isFrozen(this);
	}
	at(key: string | number): T {
		throw new Error("Method not implemented.");
	}
	put(key: string | number, value: T): void {
		if (this.isClosed) throw new Error("Object is frozen");
	}
	close(): void {
		Object.freeze(this);
	}
}

interface Collection<K, V> extends Aggregate<K, V> {
	//type: ContainerType[key, value]
	at(key: K): V;
	keys(): Iterable<K>;
	values(): Iterable<V>;
	// entries(): Iterable<[K, V]>;
}
/** A Sequence provides an ordinal (positional) collection of values.
	There are no contracts on the mutability of the sequence.
	Native strings and Arrays are assignable to Sequence.
*/
export interface Strandx<T> extends Container<T>, Iterable<T> {
	readonly length: number,
	at(index: number): T,
	indexOf(search: T, start?: number): number,
	slice(start?: number, end?: number): Strand<T>,
	concat(...values: T[]): Strand<T>
}

export interface Sequence<T> extends Aggregate<number, T> {
	at(index: number): T,
	length: number,
	indexOf(search: T, start?: number): number,
	slice(start?: number, end?: number): Sequence<T>,
	concat(...values: T[]): Sequence<T>
	//values(): Iterable<T>
}
interface Strand<T> extends Sequence<T> {
}
interface String extends Strand<String> {
}

//strings & arrays are implementations of Sequences...
const x: String = "hello";
const y: Sequence<number> = [] as number[];

/** Markup is an abstract node. Valid markup must be parseable through
	HTML and XML parsers, i.e. it is case insensitive and no shortcut-closing "/>".
	Tag names are canonically lowercase with the following grammar rule:
		 [a-z] ([a-z] | [0-9] | '$' | '_')*
	This promotes tag names to map directly to property names.  A Markup node can also
	have a name starting with "#" in which case the node's enclosing tags are not converted
	to markup strings.

	DIFFERENCE WITH DOM: text nodes can have a tag name like an element.  You can have textContent
	AND a non "#text" name with an empty Sequence<Markup>.

	Markup allows for rooted tree, DAG, and cyclic graph implementations.
*/
interface Markup extends Sequence<Markup>, Receiver {
	name: String;				//DOM.Node.nodeName
	markup: String;				//DOM.Node.outerHTML
	markupContent: String;		//DOM.Node.innerHTML
	textContent: String;

	at(index: number | String  | Markup): Markup;
	/** when the search is a string, it returns the first child with the string name. */
	indexOf(search: Markup | String, start?: number): number;
}

abstract class Abstr implements Markup {
	abstract get name(): string;
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
		return new Branch(this.name, EMPTY_ARRAY as Markup[]);
	}
	concat(...values: (Markup | string)[]): Markup {
		return new Branch(this.name, concat(EMPTY_ARRAY as Markup[], values));
	}
	receive(signal: Signal): void {
	}
}

function concat(content: Markup[], values: (Markup | string)[]) {
	content = content.slice();
	for (let value of values) {
		content.push(typeof value == "string" ? new Txt(value) : value);
	}
	return content;
}

class Branch extends Abstr {
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

class Leaf extends Branch {
	constructor(name: string, content: String) {
		super(name, [new Txt(content)]);
	}
}

class Txt extends Abstr {
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