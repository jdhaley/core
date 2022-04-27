/**	A Bundle (aka "dictionary") is a collection of <string, T> entries. 
	A Bundle isn't required to have prototype (other than null).
*/
export interface Bundle<T> {
	[key: string]: T;
}

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

export type constant = string | number | boolean | null;
export type serial = constant | Bundle<serial> | serial[];
export type pure = constant | Function | Bundle<pure> | pure[]

export const EMPTY: Bundle<pure> = Object.create(null);
EMPTY.string = ""
EMPTY.number = 0
EMPTY.boolean = false
EMPTY.bundle = Object.freeze(Object.create(null))
EMPTY.array = Object.freeze([]) as pure[]
EMPTY.function = Object.freeze(function nil(any: any): any {}),
Object.freeze(EMPTY);

export const NIL: Bundle<pure> = Object.create(EMPTY);
NIL.value = null
NIL.void = undefined
NIL.unknown = NaN
Object.freeze(NIL);
