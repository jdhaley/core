export interface Bundle<T> {
	[key: string]: T;
}

export interface Array<T> {
	length: number;
	[key: number]: T;
}

export type constant = string | number | boolean | null;

export type serial = constant | Bundle<serial> | Array<serial>;

export type runtime = serial | Function;

/** A Sequence declares an ordinal (positional) collection of values.
	There are no contracts on the mutability of the sequence.
	Runtime strings and Arrays are assignable to Sequence.
*/
export interface Sequence<T> extends Iterable<T> {
	get length(): number;
	at(key: number): T;
	indexOf(search: T, start?: number): number;
	slice(start?: number, end?: number): Sequence<T>;
	concat(...values: T[]): Sequence<T>;
}

/*
	NOTE: A Consumer can be a stable Sequence source, therefore
	append() shouldn't alter the sub sequences created from this instance.

	close() is not required to do anything, however the intent is enable
	freezing the underlying buffer, optimizing the data for access, clearing data, etc.
*/
export interface Consumer<T>  {
	append(...data: T[]): void;
	close(): void;	
	isClosed?: boolean;
}

export interface Content<T> {
	name: string;
	attr: Bundle<string>;
	content: Iterable<T>;
}

export interface Markup extends Content<Markup> {
	markup: string;			//DOM outerHTML
	markupContent: string;	//DOM innerHTML
	textContent: string;	//DOM textContent
}
