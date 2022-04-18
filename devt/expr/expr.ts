import {Parcel, Type, Value} from "../../api/value.js";
import {Scope, Compilable, Receivable} from "./compiler.js";
import {ContainerType, Signature} from "../../base/type.js";
import {Target} from "../../base/target.js";

import {Box, Eval, Pure} from "./eval.js";

//expr: primary msg* ^ cast)*
export class Expr implements Compilable {
	constructor(value: Compilable[]) {
		this.value = value;
	}
	value: Compilable[];
	compile(scope: Scope): Eval {
		if (!this.value.length) return new Pure(scope.getType("any"), null);
		let expr = this.value[0].compile(scope);
		for (let i = 1; i < this.value.length; i++) {
			let source = this.value[i];
			if (source instanceof Receivable) {
				expr = source.compile(scope, expr);
			} else {
				expr = expr.notice("error", "Expecting: Message | Arguments | Cast.")
			}
		}
		return expr;
	}
}

//  export class Asgn extends Receivable {
// 	constructor(lvalue: Eval) {
// 		super();
// 		this.lvalue = lvalue;
// 	}
// 	lvalue: Eval
// 	compile(scope: Scope, receiver: Eval): Eval {
// 		if (this.lval)
// 		throw new Error("Method not implemented.");
// 	}
// }
export class At extends Receivable {
	constructor(index: Compilable) {
		super();
		this.index = index;
	}
	index: Compilable;
	compile(scope: Scope, receiver: Eval): Eval {
		let index = this.index.compile(scope);
		if (!receiver) return index.notice("error", "@ cannot be primary.");
		return new Access(receiver, index);
	}
}
export class Put extends Receivable {
	constructor(expr: Compilable) {
		super();
		this.expr = expr;
	}
	expr: Compilable;
	compile(scope: Scope, receiver: Eval): Eval {
		let expr = this.expr.compile(scope);
		expr = new Modify(receiver, expr);
		if (!receiver) return expr.notice("error", "= cannot be primary.");
		if (!(receiver instanceof Lval)) return expr.notice("error", "expression is not assignable.");
		return expr;
	}
}
export class Msg extends Receivable {
	constructor(subject: string) {
		super();
		this.value = subject;
	}
	value: string
	compile(scope: Scope, receiver: Eval): Eval {
		let expr: Lookup
		if (receiver) {
			if (!receiver.type) {
				return receiver.notice("error", "Receiver value has no type.");
			}
			expr = new Get(receiver, this.value);
		} else {
			expr = new Lookup(scope, this.value);
		}
		if (!expr.value) {
			return expr.notice("error", `"${expr.subject}" is not defined.`);
		}
		return expr;
	}
}

export class Exprs extends Receivable {
	constructor(args: Compilable[]) {
		super();
		this.value = args;
	}
	value: Compilable[]
	compile(scope: Scope, receiver: Eval): Eval {
		let values: Eval[] = [];
		for (let source of this.value) {
			let value = source.compile(scope);
			values.push(value);
		}
		let exprs = new ExprList(values);
		if (receiver) {
			let call = new Call(receiver, exprs);
			if (!(receiver.type instanceof Signature)) {
				return call.notice("error", "Receiver is not callable.");
			}
			return call;
		}
		return exprs;
	}
}

export class As extends Receivable {
	constructor(type: Compilable) {
		super();
		this.type = type;
	}
	type: Compilable;
	compile(scope: Scope, expr: Eval): Eval {
		let type = this.type.compile(scope);
		if (type.error) return type;
		return new Cast(type, expr)
	}
}

class Lval extends Eval {
}

class Access extends Lval {
	constructor(receiver: Value, expr: Eval) {
		super();
		this.receiver = receiver;
		this.expr = expr;
	}
	receiver: Value;
	expr: Eval;
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

class Modify extends Eval {
	constructor(receiver: Eval, expr: Eval) {
		super();
		this.receiver = receiver;
		this.expr = expr;
	}
	receiver: Eval;
	expr: Eval;
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
	transform(target: any): string {
		return this.receiver.transform(target) + " = " + this.expr.transform(target);
	}
}

class Lookup extends Lval {
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
	transform(target: any): string {
		return this.subject;
	}
}

class Get extends Lookup {
	constructor(receiver: Eval, subject: string) {
		super(receiver.type, subject);
		this.receiver = receiver;
	}
	receiver: Eval;
	transform(target: Target) {
		return this.receiver.transform(target) + "." + this.subject;
	}
}

class ExprList extends Box<Eval[]> {
	constructor(value: Eval[]) {
		super(value);
	}
	get type() {
		return this.value[this.value.length - 1].type;
	}
	get pure() {
		return Pure.array(this.value);
	}
	transform(target: Target): string {
		let out = "";
		for (let value of this.value) {
			if (out != "") out += ", ";
			out += value.transform(target);
		}
		return "(" + out + ")";
	}
}

class Call extends Eval {
	constructor(callable: Eval, args: ExprList) {
		super();
		this.callable = callable;
		this.args = args;
	}
	callable: Eval
	args: ExprList;
	get type(): Type {
		return (this.callable.type as Signature)?.output;
	}
	get value(): any {
		return this;
	}
	// get pure(): any {
	// }
	transform(target: Target) {
		return this.callable.transform(target) + this.args.transform(target);
	}
}

class Cast extends Box<Eval> {
	//Something has to check the validity of the cast (either upcast or downcast);
	constructor(type: Eval, value: Eval) {
		super(value);
	}
	#type: Eval
	get type(): Type {
		return this.#type.pure instanceof Type ? this.#type.pure : undefined;
	}
	get pure(): any {
		return this.value.pure;
	}
	isDowncast() {
		return this.value.type.generalizes(this.type)
	}
	transform(context: Target) {
		let out = this.value.transform(context);
		//If the value is impure & downcast add a runtime check.
		if (this.pure === undefined && this.isDowncast) {
			out = "(" + out + ").cast(" + this.#type.transform(context) + ")"
		}
		return out;
	}
}
