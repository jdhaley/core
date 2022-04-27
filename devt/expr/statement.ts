import {Value, Type} from "../../api/value.js";
import {EMPTY} from "../../api/model.js";

import {Scope, Statement} from "../../base/compiler.js";
import {Impure, Pure} from "../../base/pure.js";
import {Interface} from "../../base/type.js";

import lex from "./lexer.js";
import parse from "./parser.js";

export abstract class Stmt extends Statement {
	initialize() {
		let source = this.source;
		for (let child of source.children) {
			if (child.nodeName == "s") {
				let stmt = createStatement(this, child);
				this.content.push(stmt);
				stmt.initialize();
			} else if (child.nodeName == "note") {
			} else {
				this.scope.notice("error", `invalid child node "<${child.nodeName}>"`);
			}
		}
	}
}

function createStatement(parent: Stmt, child: Element): Stmt {
	if (child.getAttribute("key")) return new Declaration(child, parent);
	if (child.getAttribute("keyword")) return new KeywordStatement(child, parent);
	return new ExpressionStatement(child, parent);
}

export class ExpressionStatement extends Stmt {
	getValue(): Value {
		return compileExpr(this);
	}
}

export class KeywordStatement extends Stmt {
	getValue(): Value {
		return compileExpr(this);
	}
}

export class Module extends Stmt {
	constructor(source: Element) {
		super(source);
		this.#scope = new Scope();
	}
	#scope: Scope;
	get scope(): Scope {
		return this.#scope;
	}
	getValue(): Value {
		for (let stmt of this.content) {
			if (stmt instanceof Declaration) this.scope.members[stmt.key] = stmt;
		}
		return compileObject(this);
	}
}
const COMPILING = Object.freeze(Object.create(null));

export class Declaration extends Stmt implements Value {
	initialize() {
		let source = this.source;
		this.key = source.getAttribute("key") || "";
		let facets = source.getAttribute("facets") || "";
		this.facets = facets ? facets.split(" ") : EMPTY.array as string[];
		super.initialize();
	}
	#value: Value;
	key: string;
	facets: string[];
	get type(): Type {
		return this.getValue().type;
	}
	get pure(): any {
		let value = this.getValue();
		return value == this ? undefined : value.pure;
	}
	getFacet(facet: string) {
		for (let f of this.facets) {
			if (facet === f) return f;
		}
	}
	getValue(): Value {
		if (this.#value === undefined) {
			this.#value = COMPILING;
			this.#value = compile(this);
			if (this.#value === undefined) throw new Error();
		}
		return this.#value;
	}
}

// 
//expr or object ONLY
function compile(stmt: Stmt): Value {
	let expr = compileExpr(stmt);
	if (expr) {
		if (stmt.content.length) {
			return stmt.scope.notice("warn", "Both content & expression are not allowed.", expr);
		}
		return expr;
	}
	return compileObject(stmt);
}

function compileExpr(stmt: Statement): Value {
	let value = stmt.source.getAttribute("value") || "";
	if (!value) return;
	let compilable = parse(lex(value));
	return compilable.compile(stmt.scope);
}

function compileObject(source: Statement): Value {
	let object = Object.create(null);
	for (let stmt of source.content) {
		if (stmt instanceof Declaration) {
			if (object[stmt.key]) {
				source.scope.notice("error", `Duplicate name "${stmt.key}"`, stmt)
			} else {
				object[stmt.key] = stmt;
			}
		} else {
			source.scope.notice("error", "Not a declaration", stmt as Value);
		}
	}
	for (let name in object) {
		let stmt: Declaration = object[name];
		if (stmt.getValue() == COMPILING) {
			source.scope.notice("error", `compilation cycle in "${stmt.key}"`, stmt);
		}
	}

	if (source instanceof Declaration && source.getFacet("type")) {
		return new Interface(source.key, object) as Value;
	}
	// let type = source.scope.getType("object");
	// let pure = Pure.object(object);
	// return pure === undefined ? new Impure(type, object) : new Pure(type, pure);
	return new Pure(source.scope.getType("object"), object);
}

function compileFunction(stmt: Statement) {
}
/* 
	Target:
*/

//type blockType = "object" | /*"array" |*/ "fn" | "expr" | "";
// function blockType(stmt: Statement): blockType {
// 	let type: blockType = "";
// 	for (let content of stmt.content) {
// 		if (content instanceof Declaration) {
// 			if (type == "expr") return "fn";
// 			type = "object";
// 		} else if (content instanceof KeywordStatement) {
// 			return "fn"
// 		} else {
// 			if (type) return "fn";
// 			type = "expr";
// 		}
// 	}
// 	return type;
// }

// function compileBlock(stmt: Stmt): Value {
// 	switch (blockType(stmt)) {
// 		case "object":
// 			return compileObject(stmt);
// 		case "fn":
// 		case "expr":
// 		case "":
// 	}
// 	return stmt as Value;
// }
