import {Value, Type, Bundle} from "../../api/model.js";

import {ContainerType, Contract, Signature, Tuple} from "../../base/type.js";
import {Pure} from "../../base/pure.js";
import {Scope, Compilable} from "../../base/compiler.js";
import {Msg} from "./expr.js";
import {Decl} from "./statement.js";

export class TYPE {
	constructor(value: Compilable[]) {
		this.value = value;
	}
	value: Compilable[];
	compile(scope: Scope): Type {
		let types = compileTypes(this.value, scope);
		return compileType(scope, types);
	}
}

function compileType(scope: Scope, types: Type[]): Type {
	let fn = scope.getType("function") as Contract;
	let type: Type;
	for (let i = types.length - 1; i >= 0; i--) {
		let part = types[i];
		if (part instanceof Tuple && type) {
			type = new Signature(fn, null, part, type);
		} else if (type) {
			type = new ContainerType(part as Contract, type);
		}
	}
	return type;
}

function compileTypes(source: Compilable[], scope: Scope): Type[] {
	let types: Type[] = [];
	for (let i = 0; i < source.length; i++) {
		let type: Type;
		let part = source[i];
		if (part instanceof Msg && part.value == "^") part = source[++i];
		if (part instanceof Msg) {
			type = scope.getType(part.value);
			//if (!type) return Eval.err(`Type "${part.value}" not defined.`);
		} else if (part instanceof TUPLE) {
			type = (part as TUPLE).compile(scope);
		}
		types.push(type);
	}
	return types;
}

export class TUPLE {
	constructor(value: Decl[]) {
		this.value = value;
	}
	value: Decl[];
	compile(scope: Scope): Tuple {
		let members: Bundle<Value> = Object.create(null);
		for (let decl of this.value) {
			debugger; //changed compile() to getValue().
			let type = decl.getValue();
			if (type.pure instanceof Type) {
				members[decl.key] = new Pure(scope.getType("type"), type as any);
			} else {}
		}
		return new Tuple(members);
	}
}
