import {Type, Value} from "../../api/value.js";
import {constant} from "../../base/data.js";

import {Scope, Compilable} from "../../base/compiler.js";
import {Signature} from "../../base/type.js";

import {Access, Call, Cast, ExprList, Get, Lookup, Lval, Modify} from "./eval.js";
import {Markup} from "../../api/model.js";
import {Pure} from "../../base/pure.js";

export class Const implements Compilable {
	constructor(value: constant) {
		this.value = value;
	}
	value: constant
	compile(scope: Scope): Value {
		return scope.createPure(this.value);
	}
}

export class Err implements Compilable, Value {
	constructor(message: string, source: Markup) {
		this.value = message;
	}
	type: Type;
	pure?: any;
	value: string;
	compile(scope: Scope): Value {
		scope.notice("error", this.value, this);
		return this;
	}
}
//expr: primary msg* ^ cast)*
export class Expr implements Compilable {
	constructor(value: Compilable[]) {
		this.value = value;
	}
	value: Compilable[];
	compile(scope: Scope): Value {
		if (!this.value.length) return new Pure(scope.getType("any"), null);
		let expr = this.value[0].compile(scope);
		for (let i = 1; i < this.value.length; i++) {
			let source = this.value[i];
			if (source instanceof Receivable) {
				expr = source.compile(scope, expr);
			} else {
				expr = scope.notice("error", "Expecting: Message | Arguments | Cast.", expr);
			}
		}
		return expr;
	}
}

export abstract class Receivable implements Compilable {
	abstract compile(scope: Scope, receiver: Value): Value
}

export class At extends Receivable {
	constructor(index: Compilable) {
		super();
		this.index = index;
	}
	index: Compilable;
	compile(scope: Scope, receiver: Value): Value {
		let index = this.index.compile(scope);
		if (!receiver) return scope.notice("error", `"[]" cannot be primary.`, index);
		return new Access(receiver, index);
	}
}
export class Put extends Receivable {
	constructor(expr: Compilable) {
		super();
		this.expr = expr;
	}
	expr: Compilable;
	compile(scope: Scope, receiver: Value): Value {
		let expr = this.expr.compile(scope);
		expr = new Modify(receiver, expr);
		if (!receiver) return scope.notice("error", `"=" cannot be primary.`, expr);
		if (!(receiver instanceof Lval)) return scope.notice("error", "expression is not assignable.", expr);
		return expr;
	}
}
export class Msg extends Receivable {
	constructor(subject: string) {
		super();
		this.value = subject;
	}
	value: string
	compile(scope: Scope, receiver: Value): Value {
		let expr: Lookup
		if (receiver) {
			if (!receiver.type) {
				return scope.notice("error", "Receiver value has no type.", receiver);
			}
			expr = new Get(receiver, this.value);
		} else {
			expr = new Lookup(scope, this.value);
		}
		if (!expr.value) {
			return scope.notice("error", `"${expr.subject}" is not defined.`, expr);
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
	compile(scope: Scope, receiver: Value): Value {
		let values: Value[] = [];
		for (let source of this.value) {
			let value = source.compile(scope);
			values.push(value);
		}
		let exprs = new ExprList(values);
		if (receiver) {
			let call = new Call(receiver, exprs);
			if (!(receiver.type instanceof Signature)) {
				return scope.notice("error", "Receiver is not callable.", call);
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
	compile(scope: Scope, expr: Value): Value {
		let type = this.type.compile(scope);
		if (!type.pure) return type;
		return new Cast(type, expr)
	}
}