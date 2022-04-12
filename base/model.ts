
export interface Parcel<K, V> {
	at(key: K): V;
}
export interface Consumer<K, V> {
	put(key: K, value: V): void;
}

export interface Bundle<T> {
	[key: string]: T;
}

/** A Sequence provides an ordinal (positional) collection of values.
	There are no contracts on the mutability of the sequence.
	Native strings and Arrays are assignable to Sequence.
*/
export interface Sequence<T> extends Parcel<number, T>, Iterable<T> {
	length: number,
	indexOf(search: T, start?: number): number,
	slice(start?: number, end?: number): Sequence<T>,
	concat(...values: T[]): Sequence<T>
}

/* Serialization */

export type literal = string | number | boolean | null
export type serial = literal | Object | Array;

interface Object extends Bundle<serial> {
}

interface Array extends Bundle<serial> {
	[key: string | number]: serial;
	length: number;
}