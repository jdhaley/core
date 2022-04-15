export interface Bundle<T> {
	[key: string]: T;
}

export interface Array<T> extends Iterable<T> {
	length: number;
	[key: number]: T;
}

export type constant = string | number | boolean | null

export type serial = constant | Bundle<serial> | Array<serial>;


interface Resource {
	//pure?: any //this can provide the marker for compilation.
	isClosed?: boolean;
	/** close() is not required to do anything, i.e. isClosed may be true after close() */
	close(): void;
}

interface Producer<T> extends Iterable<T>, Resource {
}

/*
	NOTE: A Consumer can be a stable Sequence source, therefore
	append() shouldn't alter the sub sequences created from this instance.
*/
interface Consumer<T> extends Resource {
	//pure?: any
	add(value: T): void;
	append(...data: T[]): void;
}

export interface Buffer<T> extends Consumer<T>, Producer<T> {
	clear(): void; //clear is from Set semantic and possibly others.
}

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

/** Markup provides a view into "markup" which is a simple subset of SGML (HTML & XML) markup.
 	Well-formed markup should be parseable through either an HTML or XML parser, therefore this view
	always produces markup with an end tag.
	- no shortcut tag closing through "<tag/>" (to support HTML)
	- start tags always have a matching end tag (to support XML)
	- when constructing Markup from XML, tags are always converted to lowercase.

	DIFFERENCE WITH DOM: Markup text nodes can have a tag name like an element.  You can have textContent
	AND a non "#text" name with an empty Sequence<Markup>.

	Markup allows for various graphs such as a rooted tree, DAG, and cyclic graphs.
*/
export interface Markup {
	/** A valid name follows the grammar rule: '#'? [a-z] ([a-z] | [0-9] | '$' | '_')*
		This promotes Markup names & typeNames to map directly to property names.
	 */
	readonly name: string;		//DOM.Node.nodeName
	readonly typeName: string;	//instead of DOM.Node.nodeType
	readonly markup: string;	//DOM.Node.outerHTML
	markupContent: string;		//DOM.Node.innerHTML
	textContent: string;		//DOM.Node.textContent
}