
import {Bundle} from "../../api/model.js";
import {Parcel, Type, Value} from "../../api/value.js";
import {level} from "../../api/notice.js";
import {Container} from "../../base/container.js";
import {Eval, Pure, NoticeValue} from "./values.js";

export interface Compilable {
	compile(scope: Scope, receiver?: Value): Value
}

export abstract class Receivable implements Compilable {
	abstract compile(scope: Scope, receiver: Value): Value
}

export class Scope extends Parcel<string, Value> implements Container<Value> /*implements Value*/ {
	constructor(from: Scope | object) {
		super();
		if (from instanceof Scope) {
			this.#members = Object.create(from.#members);
		} else {
			this.#members = Object.create(null);
		}
	}
	#members: Bundle<Value>;
	at(name: string): Value {
		if (Object.getOwnPropertyDescriptor(this.#members, name)) return this.#members[name];
		return Eval.err(`"${name}" is not in scope`);	
	}
	put(key: string, value: Value): void {
		let member: any = this.#members[key]
		if (member?.facets?.reserved) {
			value = this.notice("error", `"${key}" is a reserved name.`, value);
		}
		this.#members[key] = value;
	}
	getType(name: string): Type {
		let type = this.at(name);
		if (type?.pure instanceof Type) return type.pure;
	}
	createPure(value: any): Pure {
		let type = this.getType(typeOf(value));
		return new Pure(type, value);
	}
	notice(level: level, message: string, value: Value) {
		return new NoticeValue(level, message, value);
	}
}

function typeOf(value: any): string {
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
			if (value instanceof Type) return "type";
			return "object";
		case "bigint":
		case "symbol":
		default:
			return "unknown";
	}
}
