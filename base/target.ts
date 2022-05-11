
import {Content, Parcel, Type, Value} from "../api/model.js";
import {bundle, EMPTY, Notification, level, pure} from "../api/util.js";
import {Context, Transform} from "../api/transform.js";

export interface Eval {
	evaluate(): Value;
	transform(target: Target): string
}

export interface Property extends Eval {
	readonly key: string;
	readonly facets: string[];
}

export interface Source extends Eval, Content {
	// scope is compatible with Type to enable common interface for getting property values.
	scope: Parcel<Value>;
	
	load(source: any): void;
	use(pathname: string): void;
}

type Transforms = bundle<Transform<Eval, string>>

export class Target implements Context<string> {
	constructor(transforms: Transforms) {
		this.transforms = transforms;
	}
	declare container: undefined;
	transforms: Transforms;
	target(name: string, value: Value): string {
		return this.transforms[name].call(value, this);
	}
}

export class Notice implements Notification, Value, Eval {
	constructor(level: level, message: string, value?: Value) {
		console[level](message, value);
		this.#value = value || EMPTY.object;
		this.level = level;
		this.message = message;
	}
	#value: Value;
	level: level;
	message: string;

	get type() {
		return this.#value.type;
	}
	get pure() {
		return this.#value.pure;
	}
	get error(): string {
		if (this.level == "error") return this.message
	}

	evaluate(): Value {
		return this.#value;
	}
	transform(target: Target): string {
		return `/*${this.message}*/`
	}
}

export class Impure implements Parcel<Value> {
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
	transform(target: Target): string {
		throw new Error("Method not implemented.");
	}
}

export class Pure extends Impure {
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
	static object(parcel: bundle<Value>): bundle<pure> {	
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
