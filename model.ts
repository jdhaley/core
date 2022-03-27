export interface Parcel<T> {
	[key: string]: T
}

export abstract class Container<T> {
	abstract get keyedBy(): "string" | "number";
	abstract at(key: string | number): T
}

export abstract class Bag<T> extends Container<T> {
	abstract put(key: string | number, value: T): void
}

export class Type extends Container<Value> {
	get keyedBy(): "string" {
		return "string"
	}
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

export interface Value {
	type: Type;
	pure: any;
}
