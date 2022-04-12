export type serial = string | number | boolean | null | serial[] | Bundle<serial>;
//type _value_ = serial | Value | Container | Function

export interface Bundle<T> {
	[key: string]: T
}

export interface Composite extends Aggregate<string, any> {
}

export class Parcel<V> implements Aggregate<string, V> {
	at(key: string): V {
		return undefined;
	}
}

export abstract class Container<T> implements Aggregate<string | number, T> {
	abstract at(key: string | number): T;
}

export interface Bag<T> extends Container<T> {
	put(key: string | number, value: T): void;
}

export interface Aggregate<K, V> {
	at(key: K): V;
}
