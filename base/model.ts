export interface Parcel<T> {
	[key: string]: T
}

export type serial = string | number | boolean | null | serial[] | Parcel<serial>;

//type _value_ = serial | Function | Value | Container

export interface Value {
	type: Type;
	pure: any;
}

export abstract class Container<T> {
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
