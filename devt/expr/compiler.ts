
import {Bundle} from "../../api/model.js";
import {Parcel, Type, Value } from "../../api/value.js";
import {Container} from "../../base/container.js";
import {Target} from "../../base/target.js";
import {Domain, LiteralType} from "../../base/type.js";

import {Declaration, Eval, Impure, Pure} from "./eval.js";

export interface Compilable {
	compile(scope: Scope, receiver?: Value): Eval
}

export abstract class Receivable implements Compilable {
	abstract compile(scope: Scope, receiver: Value): Eval
}

export class Scope extends Parcel<string, Eval> implements Container<Eval> /*implements Value*/ {
	static typeOf = typeOf;
	constructor(from: Scope | object) {
		super();
		if (from instanceof Scope) {
			this.#members = Object.create(from.#members);
			this.#modules = from.#modules;
		} else {
			this.#members = Object.create(null);
			this.#modules = from;
		}
	}
	#members: Bundle<Eval>;
	#modules: object;
	at(name: string): Eval {
		if (Object.getOwnPropertyDescriptor(this.#members, name)) return this.#members[name];
		return Eval.err(`"${name}" is not in scope`);	
	}
	put(key: string, value: Eval): void {
		if (this.#members[key]?.facets["reserved"]) {
			value = value.notice("error", `"${key}" is a reserved name.`);
		}
		this.#members[key] = value;
	}
	getType(name: string): Type {
		let type = this.at(name);
		if (type?.pure instanceof Type) return type.pure;
	}
	getModule(name: string): Eval {
		let module = this.#modules[name];
		if (module instanceof Eval) return module;
		if (module === undefined) return Eval.err(`Module "${name}" not found.`);
		if (module === null) return Eval.err(`Dependency cycle for "${name}"`);
		// if (module instanceof Compilable) {
		// 	this.#modules[name] = null;
		// 	let scope = new Scope(this.#modules);
		// 	module = module.compile(scope);
		// 	this.#modules[name] = module;
		// 	return module;
		// }
		throw new Error(`Module "${name}" isn't compilable.`);
	}
	createPure(value: any): Pure {
		let type = this.getType(typeOf(value));
		return new Pure(type, value);
	}
}

export class Err implements Compilable {
	constructor(msg: string) {
		this.message = msg;
	}
	message: string
	compile(scope: Scope): Eval {
		return Eval.err(this.message);
	}
}

export class Const implements Compilable {
	constructor(value: string | number | boolean) {
		this.value = value;
	}
	value: any
	compile(scope: Scope): Eval {
		return scope.createPure(this.value);
	}
}

export class Decl implements Compilable {
	value: string;
	facets: string[]
	constructor(type: string, facets?: string[]) {
		this.value = type;
		this.facets = facets;
	}
	compile(scope: Scope): Eval {
		let type = scope.getType(this.value);
		let decl = new Declaration(type, this.facets);
		return type ? decl : decl.notice("error", `Type "${this.value}" cannot be retrieved.`)
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

const nil = Object.freeze({
	any: null,
	void: undefined,
	unknown: NaN,
	string: "",
	number: 0,
	boolean: false,
	double: NaN,
	object: Object.freeze({}),
	array: Object.freeze([]),
	function: Object.freeze(() => undefined),
});
