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
	attr: Bundle<string>;
	content: Iterable<T>;
}

export interface Markup extends Content<Markup> {
	markup: string;			//DOM outerHTML
	markupContent: string;	//DOM innerHTML
	textContent: string;	//DOM textContent
}

/**	A Bundle (aka "dictionary") is a collection of <string, T> entries. 
	A Bundle's prototype should be another Bundle or null.
*/
export interface Bundle<T> {
	[key: string]: T;
}

export type constant = string | number | boolean | null;
export type serial = constant | Bundle<serial> | serial[];
export type pure = constant | Function | Bundle<pure> | pure[]

// class Nil {
// 	void = undefined;
// 	value = null;
// 	string = "";
// 	boolean = false;
// 	number = 0;
// 	unknown = NaN;
// }
//type nil = undefined | null | "" | false | 0 | NaN;

class Empty {
	object = Object.freeze(Object.create(null));
	array = Object.freeze([]) as pure[];
	function = Object.freeze(function nil(any: any): any {});
}
export const EMPTY = Object.freeze({
	object: Object.freeze(Object.create(null)),
	array: Object.freeze([]) as pure[],
	function: Object.freeze(function nil(any: any): any {})
});

//TODO value, sequence and other types defined in core.api
export function typeOf(value: any): string {
	switch (typeof value) {
		case "undefined":
			return "void"
		case "number":
			if (value === NaN) return "unknown";
		case "boolean":
		case "string":
		case "function":
			return typeof value;
		case "object":
			if (value === null) return "any";
			if (typeof value.valueOf == "function") value = value.valueOf();
			if (typeof value != "object") return typeOf(value);
			if (value instanceof Array) return "array";
			if (value.generalizes) return "type";
			return "object";
		case "bigint":
		case "symbol":
		default:
			return "unknown";
	}
}
