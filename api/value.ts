
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
	generalizes(type: Type): boolean {
		return type == this;
	}
	categorizes(value: any): boolean {
		return value?.type ? this.generalizes(value.type) : false;
	}
}
