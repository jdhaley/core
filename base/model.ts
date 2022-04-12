export type serial = string | number | boolean | null | serial[] | Bundle<serial>;
//type _value_ = serial | Value | Container | Function

export interface Bundle<T> {
	[key: string]: T
}

export interface Aggregate<K, V> {
	at(key: K): V;
}

export interface Composite extends Aggregate<string, any> {
}

export class Parcel<V> implements Aggregate<string, V> {
	at(key: string): V {
		return undefined;
	}
}

export abstract class Container<T> implements Aggregate<string | number, T> {
	type?: Type;
	abstract at(key: string | number): T;
}

export interface Bag<T> extends Container<T> {
	put(key: string | number, value: T): void;
}

export interface Value {
	/** undefined is equivalent to TS "any". A Type is a constraint on a value. */
	type?: Type;
	/** undefined is impure. Use null to indicate a valueless value. */
	pure?: any;
}

export class Type {
	at(key: string): Value {
		return undefined;
	}
	generalizes(type: Type): boolean {
		return type == this;
	}
	categorizes(value: any): boolean {
		return value?.type ? this.generalizes(value.type) : false;
	}
}
