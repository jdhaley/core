
export interface Value {
	/** undefined is equivalent to TS "any". A Type is a constraint on a value. */
	type: Type;
	/** undefined is impure. Use null to indicate a valueless value. */
	pure?: any; //possibly value;
}

export interface Parcel<K, V> extends Value {
	at(key: K): V 
}

export class Type implements Parcel<string, Value> {
	get type() {
		return undefined;
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
