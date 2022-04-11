export type serial = string | number | boolean | null | serial[] | Parcel<serial>;

export interface Parcel<T> {
	[key: string]: T
}

export interface Aggregate<K, V> {
	at(key: K): V;
}

export abstract class BUNDLE<V> implements Aggregate<string, V> {
	at(key: string): V {
		return undefined;
	}
}

export abstract class Container<T> implements Aggregate<string | number, T> {
	type?: Type;
	abstract at(key: string | number): T;
}

//type _value_ = serial | Function | Value | Container

export interface Value {
	/** undefined is equivalent to TS "any". A Type is a constraint on a value. */
	type?: Type;
	/** undefined is impure. Use null to indicate a value-less value. */
	pure?: any;
}

export class Type extends BUNDLE<Value> {
	generalizes(type: Type): boolean {
		return type == this;
	}
	categorizes(value: any): boolean {
		return value?.type ? this.generalizes(value.type) : false;
	}
}
