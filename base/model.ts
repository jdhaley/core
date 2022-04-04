export interface Parcel<T> {
	[key: string]: T
}

export type serial = string | number | boolean | null | serial[] | Parcel<serial>;

//type _value_ = serial | Function | Value | Container

export interface Value {
	/** undefined is equivalent to TS "any". A Type is a constraint on a value. */
	type?: Type;
	/** undefined is impure. Use null to indicate a value-less value. */
	pure?: any;
}

export abstract class Container<T> {
	type?: Type;
	abstract at(key: string | number): T
}

export class Type extends Container<Value> {
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
