// export interface Bundle<T> {
// 	[key: string]: T;
// }
// export interface Array<T> extends Iterable<T> {
// 	length: number;
// 	[key: number]: T;
// }
// export type constant = string | number | boolean | null
// export type serial = constant | Bundle<serial> | Array<serial>;

// export type value = serial | Function | Value;

export interface Value {
	/** undefined is equivalent to TS "any". A Type is a constraint on a value. */
	type: Type;
	/** undefined is impure. Use null to indicate a valueless value. */
	pure?: any; //possibly value;
}

export class Parcel<K, V> implements Value {
	get type() {
		return undefined;
	}
	at(key: K): V {
		return undefined;
	}
}

export class Type extends Parcel<string, Value> {
	get type() {
		return TYPE_TYPE;
	}
	generalizes(type: Type): boolean {
		return type == this;
	}
	categorizes(value: any): boolean {
		return value?.type ? this.generalizes(value.type) : false;
	}
}

const TYPE_TYPE = Object.freeze(new Type());