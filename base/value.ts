
export interface Value {
	/** undefined is equivalent to TS "any". A Type is a constraint on a value. */
	type?: Type;
	/** undefined is impure. Use null to indicate a valueless value. */
	pure?: any;
}

let TYPE_TYPE: Type;

export class Type implements Value {
	get type() {
		return TYPE_TYPE;
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

TYPE_TYPE = Object.freeze(new Type());