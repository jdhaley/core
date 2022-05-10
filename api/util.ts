export interface bundle<T> {
	[key: string]: T
}

export type key = string | number /*| symbol */;
export type constant = key | boolean | null;
export type serial = constant | bundle<serial> | serial[];
export type pure = constant | Function | bundle<pure> | pure[]

export type other = symbol | bigint;
// class Nil {
// 	void = undefined;
// 	value = null;
// 	string = "";
// 	boolean = false;
// 	number = 0;
// 	unknown = NaN;
// }
//type nil = undefined | null | "" | false | 0 | NaN;

// class Empty {
// 	object = Object.freeze(Object.create(null));
// 	array = Object.freeze([]) as pure[];
// 	function = Object.freeze(function nil(any: any): any {});
// }
export const EMPTY = Object.freeze({
	object: Object.freeze(Object.create(null)),
	array: Object.freeze([]) as any[],
	function: Object.freeze(function nil(any: any): any {})
});

//TODO value, sequence and other types defined in core.api
export function typeOf(value: any): string {
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
			if (typeof value != "object") return typeOf(value);
			if (value instanceof Array) return "array";
			if (value.generalizes) return "type";
			return "object";
		case "bigint":
		case "symbol":
		default:
			return "unknown";
	}
}


export type level = "error" | "warn" | "info" | "debug";

export interface Notification {
	level: level;
	message: string;
}

export interface Commandable<R> {
	undo(): R;
	redo(): R;
}

export abstract class Command<R> implements Commandable<R> {
	prior: Command<R>;
	next: Command<R>;
	abstract get name(): string;
	abstract undo(): R;
	abstract redo(): R;
}
