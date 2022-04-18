import {Parcel, Type, Value} from "../../api/value.js";
import {ContainerType, Signature} from "../../base/type.js";
import {Pure} from "../../base/pure.js";

export abstract class Lval implements Value {
	abstract get type(): Type;
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

export class Modify implements Value {
	constructor(receiver: Value, expr: Value) {
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

export class Lookup implements Value {
	constructor(context: Parcel<string, Value>, subject: string) {
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

export class ExprList implements Value {
	constructor(value: Value[]) {
		this.value = value;
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

export class Call implements Value {
	constructor(callable: Value, args: ExprList) {
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

export class Cast implements Value {
	//Something has to check the validity of the cast (either upcast or downcast);
	constructor(type: Value, value: Value) {
		this.value = value;
		this.#type = type;
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

