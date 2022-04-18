import {Value} from "../../api/value.js";
import {Scope, Compilable, Receivable} from "./compiler.js";
import {Signature} from "../../base/type.js";

import {Access, Call, Cast, Eval, ExprList, Get, Lookup, Lval, Modify, Pure} from "./values.js";

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
	compile(scope: Scope, expr: Value): Value {
		let type = this.type.compile(scope);
		if (!type.pure) return type;
		return new Cast(type, expr)
	}
}
