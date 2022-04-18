import {Bundle} from "../../api/model.js";
import {Type, Value} from "../../api/value.js";
import {Domain, LiteralType} from "../../base/type.js";

import {level, Notice} from "../../api/notice.js";
import {Target, Targeter} from "../../base/target.js";

const EMPTY_ARRAY = Object.freeze([]);

export class Eval extends Targeter implements Value {
	static err(message: string) {
		return new NoticeValue("error", message, null);
	}
	get type(): Type {
		return undefined;
	}
	get value(): any {
		return undefined;
	}
	get pure(): any {
		return undefined;
	}
	get error(): string {
		return "";
	}
	get facets(): string[] {
		return EMPTY_ARRAY as string[];
	}
	transform(target: Target): any {
		return JSON.stringify(this.value);
	}
	notice(level: level, message: string) {
		return new NoticeValue(level, message, this);
	}
}

export class Box<T> extends Eval {
	constructor(value: T) {
		super();
		this.#value = value;
	}
	#value: T
	get value(): T {
		return this.#value;
	}
}

export class Decorator extends Box<Value>  {
	constructor(value: Value) {
		super(value);
	}
	get type() {
		return this.value?.type;
	}
	get pure() {
		return this.value?.pure;
	}
	get error(): string {
		return this.value instanceof Eval ? this.value.error : "";
	}
	get facets(): string[] {
		return this.value instanceof Eval ? this.value.facets : super.facets;
	}
	transform(target: Target) {
		return this.value instanceof Eval ? this.value.transform(target) : "";
	}
}

class NoticeValue extends Decorator implements Notice {
	constructor(level: level, message: string, value: Value) {
		console[level](message, value);
		super(value);
		this.level = level;
		this.message = message;
	}
	get error(): string {
		if (this.level == "error") return this.message
	}
	level: level
	message: string;
}

abstract class Typed extends Eval {
	constructor(type: Type) {
		super();
		this.#type = type;
	}
	#type: Type
	get type(): Type {
		return this.#type;
	}
}
const NO_FACETS = Object.freeze([]) as string[];

export class Declaration extends Typed {
	constructor(type: Type, facets?: string[]) {
		super(type);
		this.#facets = facets || NO_FACETS;
	}
	#facets: string[];
	get facets(): string[] {
		return this.#facets;
	}
	transform(context: Target) {
		throw new Error("Method not implemented.");
	}
}

export class Impure<T> extends Box<T> {
	constructor(type: Type, value: T) {
		super(value);
		this.#type = type;
	}
	#type: Type;
	get type(): Type {
		return this.#type;
	}
}

type Literal =  string | number | boolean | Function | Array<Literal> | Bundle<Literal> | Type

export class Pure extends Typed  {
	static call(method: Eval, receiver: Eval, args: Box<Eval[]>): any {
		let pure = Pure.array(args.value);
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
	
	static object(parcel: Bundle<Value>): Bundle<Literal> {	
		let obj = {};
		for (let key in parcel) {
			let value = parcel[key].pure
			if (value === undefined) return undefined;
			obj[key] = value;
		}
		return obj;
	}
	static array(values: Array<Value>): Array<Literal> {
		let arr = [];
		for (let ele of values) {
			let value = ele.pure;
			if (value === undefined) return undefined;
			arr.push(value);
		}
		return arr;	
	}
	constructor(type: Type, value: Literal) {
		super(type);
		this.#pure = value;
		Object.freeze(this);
	}
	#pure: Literal;
	get pure(): Literal {
		return this.#pure;
	}
	transform(target: any): string {
		return JSON.stringify(this.pure);
	}
}

export class Statement extends Impure<Eval> {
	static TYPE = new Domain(["expr", "var", "return", "block", "if", "while", "switch", "case"]).instance;
	constructor(typeName: string, expr: Eval, statements?: Statement[]) {
		super(Statement.TYPE[typeName], expr);
		this.statements = statements;
	}
	statements: Statement[];
	get typeName() {
		return (this.type as LiteralType).value as string;
	}
	transform(target: Target): string {
		return target.target(this.typeName, this);
	}
}
