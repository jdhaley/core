export interface Value {
	/** A Type is a constraint on a value, therefore "undefined" is treated like Typescript "any" */
	type?: Type;
	/** undefined is impure. Use null to for a pure non-existent value */
	pure?: any; //possibly value;
}

export interface Type extends Value {
	at(key: string): Value;
	generalizes(type: Type): boolean;
	categorizes(value: any): boolean;
}

export interface Parcel<K, V> {
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

export interface Resource {
	/** close() is not required to do anything other than signal the resource isClosed. */
	close(): void;	
	isClosed?: boolean;
}

/*
	NOTE: A Consumer can be a stable Sequence source, therefore
	append() shouldn't alter the sub sequences created from this instance.
*/
export interface Consumer<T> extends Resource  {
	append(...data: T[]): void;
}

export interface Content<T> {
	name: string;
	attr: {
		[key: string]: string
	};
	content: Iterable<T>;
}

export interface Markup extends Content<Markup> {
	markup: string;			//DOM outerHTML
	markupContent: string;	//DOM innerHTML
	textContent: string;	//DOM textContent
}
