export interface Value {
	/** "undefined" is treated like Typescript "unknown" */
	type?: Type;
	/** "undefined" is impure. All other values, including "null", and "NaN", are pure. */
	pure?: any;
}

export interface Type {
	generalizes(type: Type): boolean;
	for(value: Value): boolean;
}

export interface Signature extends Type {
	input: Type
	output: Type
}

export interface Producer<I, O> extends Value {
	//type?: Signature
	at(input?: I): O; 
}

export interface Parcel<V> extends Producer<string, V> {
}

/** A Sequence declares an ordinal (positional) collection of values.
	There are no contracts on the mutability of the sequence.
	Runtime strings and Arrays are assignable to Sequence.
*/
export interface Sequence<T> extends Producer<number, T>, Iterable<T> {
	get length(): number;
	indexOf(search: T, start?: number): number;
	slice(start?: number, end?: number): Sequence<T>;
	concat(...values: T[]): Sequence<T>;
}

/** If an attribute is an Entity, the referenced entity must have an "id" attribute.*/
export interface Entity extends Parcel<string | number | boolean | Entity> {
	name?: string;
	attributeNames(): Iterable<string>
}

export interface Markup {
	readonly markup: string;	//DOM outerHTML
	markupContent: string;		//DOM innerHTML
	textContent: string;		//DOM textContent
}

export interface Content extends Entity, Markup {
	content: Iterable<any>
}

/*
	NOTE: A Consumer can be a stable Sequence source, therefore
	append() shouldn't alter the sub sequences created from this instance.
*/
export interface Consumer<T> {
	append(...data: T[]): void;
}

export interface bundle<T> {
	[key: string]: T
}

export type key = string | number /*| symbol */;
export type constant = key | boolean | null;
export type serial = constant | bundle<serial> | serial[];
export type pure = constant | Function | bundle<pure> | pure[]

export type other = symbol | bigint;

export type level = "error" | "warn" | "info" | "debug";

export interface Notification {
	level: level;
	message: string;
}

//Experimental: Adapting the Producer API for functions...
type arguments = [receiver: any, ...args: any]
Function.prototype["at"] = function at(this: Function, args?: arguments) {
	this.apply(...args);
}