export interface Bundle<T> {
	[key: string]: T;
}

/** A Sequence provides an ordinal (positional) collection of values.
	There are no contracts on the mutability of the sequence.
	Native strings and Arrays are assignable to Sequence.
*/
export interface Sequence<T> extends Iterable<T> {
	length: number,
	at(key: number): T;
	indexOf(search: T, start?: number): number,
	slice(start?: number, end?: number): Sequence<T>,
	concat(...values: T[]): Sequence<T>
}

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
export interface Markup {
	typeName: string;			//instead of DOM.Node.nodeType
	name: string;				//DOM.Node.nodeName
	markup: string;				//DOM.Node.outerHTML
	markupContent: string;		//DOM.Node.innerHTML
	textContent: string;		//DOM.Node.textContent
}

// export interface Consumer<T> {
// 	add(value: T): void;
// }

export interface Bag<T> {
	isClosed?: boolean;
	add(value: T): void;
	clear(): void; //clear - Set semantic
	close(): void;
}

export type literal = string | number | boolean | null

/* Serialization */

export type serial = literal | Object | Array;

interface Object extends Bundle<serial> {
}

interface Array extends Bundle<serial> {
	length: number;
	[key: number]: serial;
}