import {Bundle} from "../../api/model.js";
import {Parcel, Type, Value} from "../../api/value.js";
import {level, Notice} from "../../api/notice.js";
import {ContainerType, Signature} from "../../base/type.js";
import { Target, Targeter } from "../../base/target.js";

export abstract class Eval implements Value {
	get type(): Type {
		return undefined;
	}
	get pure(): any {
		return undefined;
	}
	get error(): string {
		return undefined;
	}
}

export class NoticeValue extends Eval implements Notice {
	constructor(level: level, message: string, value: Value) {
		super();
		console[level](message, value);
		this.value = value;
		this.level = level;
		this.message = message;
	}
	level: level
	message: string;
	value: Value
	get type() {
		return this.value?.type;
	}
	get pure() {
		return this.value?.pure;
	}
	get error(): string {
		if (this.level == "error") return this.message
	}
}

export class Lval extends Eval {
}

export class Access extends Lval {
	constructor(receiver: Value, expr: Value) {
		super();
		this.receiver = receiver;
		this.expr = expr;
	}
	receiver: Value;
	expr: Value;
	get contract(): Parcel<string, Value> {
		return this.receiver.type;
	}
	get type(): Type {
		return (this.receiver.type as ContainerType).output;
	}
	get value(): Value {
		if (this.expr.pure) return this.contract.at(this.expr.pure);
	}
	get pure(): any {
		return this.value?.pure;
	}
}

export class Modify extends Eval {
	constructor(receiver: Value, expr: Value) {
		super();
		this.receiver = receiver;
		this.expr = expr;
	}
	receiver: Value;
	expr: Value;
	get contract(): Parcel<string, Value> {
		return this.receiver.type;
	}
	get type(): Type {
		return (this.receiver.type as ContainerType).output;
	}
	get value(): Value {
		if (this.expr.pure) return this.contract.at(this.expr.pure);
	}
	get pure(): any {
		return this.value?.pure;
	}
	// transform(target: Target): string {
	// 	return target.transform(this.receiver) + " = " + this.expr.transform(target);
	// }
}

export class Lookup extends Lval {
	constructor(context: Parcel<string, Value>, subject: string) {
		super();
		this.context = context;
		this.subject = subject;
	}
	context: Parcel<string, Value>
	subject: string;
	get type() {
		return this.value?.type;
	}
	get pure(): any {
		return this.value?.pure;
	}
	get value(): Value {
		return this.context.at(this.subject);
	}
	// transform(target: any): string {
	// 	return this.subject;
	// }
}

export class Get extends Lookup {
	constructor(receiver: Value, subject: string) {
		super(receiver.type, subject);
		this.receiver = receiver;
	}
	receiver: Value;
	// transform(target: Target) {
	// 	return this.receiver.transform(target) + "." + this.subject;
	// }
}

export class ExprList extends Eval {
	constructor(value: Value[]) {
		super();
		value = value;
	}
	value: Value[]
	get type() {
		return this.value[this.value.length - 1].type;
	}
	get pure() {
		return Pure.array(this.value);
	}
	// transform(target: Target): string {
	// 	let out = "";
	// 	for (let value of this.value) {
	// 		if (out != "") out += ", ";
	// 		out += value.transform(target);
	// 	}
	// 	return "(" + out + ")";
	// }
}

export class Call extends Eval {
	constructor(callable: Value, args: ExprList) {
		super();
		this.callable = callable;
		this.args = args;
	}
	callable: Value
	args: ExprList;
	get type(): Type {
		return (this.callable.type as Signature)?.output;
	}
	get value(): any {
		return this;
	}
	// get pure(): any {
	// }
	// transform(target: Target) {
	// 	return this.callable.transform(target) + this.args.transform(target);
	// }
}

export class Cast extends Eval {
	//Something has to check the validity of the cast (either upcast or downcast);
	constructor(type: Value, value: Value) {
		super();
		this.value = value;
	}
	value: Value;
	#type: Value
	get type(): Type {
		return this.#type.pure instanceof Type ? this.#type.pure : undefined;
	}
	get pure(): any {
		return this.value.pure;
	}
	isDowncast() {
		return this.value.type.generalizes(this.type)
	}
	// transform(context: Target) {
	// 	let out = this.value.transform(context);
	// 	//If the value is impure & downcast add a runtime check.
	// 	if (this.pure === undefined && this.isDowncast) {
	// 		out = "(" + out + ").cast(" + this.#type.transform(context) + ")"
	// 	}
	// 	return out;
	// }
}

type Literal =  string | number | boolean | Function | Array<Literal> | Bundle<Literal> | Type

export class Pure  {
	static call(method: Value, receiver: Value, args: Value[]): any {
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
		this.#type = type;
		this.#pure = value;
		Object.freeze(this);
	}
	#type: Type
	#pure: Literal;
	get type(): Type {
		return this.#type;
	}
	get pure(): Literal {
		return this.#pure;
	}
	// transform(target: any): string {
	// 	return JSON.stringify(this.pure);
	// }
}
