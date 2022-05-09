export interface Value {
	/** "undefined" is treated like Typescript "unknown" */
	type?: Type;
	/** "undefined" is impure. All other values, including "null", and "NaN", are pure. */
	pure?: any;
}

export interface Type extends Value {
	at(key: string): Value;
	generalizes(type: Type): boolean;
	categorizes(value: any): boolean;
}

export interface Parcel<K, V> extends Value {
	at(key: K): V 
}

/** A Sequence declares an ordinal (positional) collection of values.
	There are no contracts on the mutability of the sequence.
	Runtime strings and Arrays are assignable to Sequence.
*/
export interface Sequence<T> extends Parcel<number, T>, Iterable<T> {
	get length(): number;
	indexOf(search: T, start?: number): number;
	slice(start?: number, end?: number): Sequence<T>;
	concat(...values: T[]): Sequence<T>;
}

export interface Content<T> extends Parcel<string, string> {
	name: string;
	content: Iterable<T>;
}

/*
if needed: attributes: Iterable<string> can be added to Content or Markup
to iterate over attribute names.  The attribute names could come from a
"ContentType".
*/

export interface Markup extends Content<Markup> {
	readonly markup: string;	//DOM outerHTML
	markupContent: string;		//DOM innerHTML
	textContent: string;		//DOM textContent
}

interface Resource {
	/** close() is not required to do anything other than signal the resource isClosed. */
	close(): void;	
	isClosed?: boolean;
}

/*
	NOTE: A Consumer can be a stable Sequence source, therefore
	append() shouldn't alter the sub sequences created from this instance.
*/
export interface Consumer<T> {
	append(...data: T[]): void;
}

