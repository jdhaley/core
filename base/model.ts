export interface Bundle<T> {
	[key: string]: T;
}

export interface Array<T>  {
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
	clear(): void; //clear is from Set semantic, possibly others.
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
