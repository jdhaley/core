import {Value, Parcel, Type, Bundle, pure} from "../api/model.js";

export class Impure implements Parcel<string, Value> {
	constructor(type: Type, value: any) {
		this.type = type;
		this.value = value;
		Object.freeze(this);
	}
	readonly type: Type;
	readonly value: any;
	get pure() {
		return undefined;
	}
	at(key: string): Value {
		return this.value ? this.value[key] : undefined;
	}
}

export class Pure extends Impure {
	static typeOf(value: any): string {
		switch (typeof value) {
			case "undefined":
				return "void"
			case "number":
				if (value === NaN) return "unknown";
			case "boolean":
			case "string":
			case "function":
				return typeof value;
			case "object":
				if (value === null) return "any";
				if (typeof value.valueOf == "function") value = value.valueOf();
				if (typeof value != "object") return this.typeOf(value);
				if (value instanceof Array) return "array";
				if (value instanceof Type) return "type";
				return "object";
			case "bigint":
			case "symbol":
			default:
				return "unknown";
		}
	}
	
	static call(method: Value, receiver: Value, args: Value[]): pure {
		let pure = Pure.array(args);
		let fn = method.pure as Function;
		if (fn && !(fn instanceof Function)) return undefined;
		let self = receiver ? receiver.pure : undefined;
		if (fn  && pure && self !== undefined) {
			try {
				let output = fn.apply(self, pure);
				if (output === undefined) output = null;
				return output;
			} catch (err) {
				//if there was an exception purifying the call it will just be
				//treated as an impure.
				console.error(err);
			}
		}
	}
	static object(parcel: Bundle<Value>): Bundle<pure> {	
		let obj = {};
		for (let key in parcel) {
			let value = parcel[key].pure
			if (value === undefined) return undefined;
			obj[key] = value;
		}
		return obj;
	}
	static array(values: Array<Value>): Array<pure> {
		let arr = [];
		for (let ele of values) {
			let value = ele.pure;
			if (value === undefined) return undefined;
			arr.push(value);
		}
		return arr;	
	}
	get pure(): pure {
		return this.value;
	}
}
