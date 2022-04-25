import {Value, Type} from "../../api/value.js";
import {EMPTY} from "../../base/data.js";
import {Scope, Statement} from "../../base/compiler.js";
import lex from "./lexer.js";
import parse from "./parser.js";
import { Impure, Pure } from "../../base/pure.js";

abstract class Stmt extends Statement {
	createChild(child: Element) {
		if (child.getAttribute("key")) return new Declaration(child, this);
		if (child.getAttribute("keyword")) return new KeywordStatement(child, this);
		return new ExpressionStatement(child, this);
	}	
}

export class ExpressionStatement extends Stmt {
	compile(): Value {
		throw new Error("Not implemented.");
	}
}

export class KeywordStatement extends Stmt {
	compile(): Value {
		throw new Error("Not implemented.");
	}
}

const COMPILING = Object.freeze(Object.create(null));

type blockType = "object" | /*"array" |*/ "fn" | "expr" | "";

export class Module extends Stmt {
	constructor(source: Element) {
		super(source);
		this.#scope = new Scope();
	}
	#scope: Scope;
	get scope(): Scope {
		return this.#scope;
	}
	compile(): Value {
		for (let stmt of this.content) {
			if (stmt instanceof Declaration) this.scope.put(stmt.key, stmt);
		}
		for (let stmt of this.content) {
			if (stmt.getValue() == COMPILING) {
				throw new Error("compiling cycle");
			}
		}
		let type = this.scope.getType("object");
		let pure = Pure.object(this.scope.members);
		return pure ? new Pure(type, pure) : new Impure(type, this.scope.members);
	}
}
export class Declaration extends Stmt implements Value {
	initialize() {
		let source = this.source;
		this.key = source.getAttribute("key") || "";
		let facets = source.getAttribute("facets") || "";
		this.facets = facets ? facets.split(" ") : EMPTY.array as string[];
	}
	#value: Value;
	key: string;
	facets: string[];
	get type(): Type {
		return this.getValue().type;
	}
	get pure(): any {
		let value = this.getValue();
		return value.pure;
	}
	compile(): Value {
		return null;
	}
	// protected compile(): Value {
	// 	let expr = this.compileExpr();
	// 	if (expr) {
	// 		if (this.content.length) {
	// 			return this.scope.notice("warn", "Both content & expression are not allowed.", expr);
	// 		}
	// 		return expr;
	// 	}
	// 	return compileBlock(this);
	// }
}


function blockType(content: Statement[]): blockType {
	let type: blockType = "";
	for (let stmt of content) {
		if (stmt instanceof Declaration) {
			if (type == "expr") return "fn";
			type = "object";
		} else if (stmt instanceof KeywordStatement) {
			return "fn"
		} else {
			if (type) return "fn";
			type = "expr";
		}
	}
	return type;
}

	// protected compile(): Value {
	// 	this.compileStatements();
	// 	return this.compileExpr();
	// }
	// protected compileStatements(): void {
	// 	for (let stmt of this.content) {
	// 		if (stmt.getValue() == COMPILING) {
	// 			throw new Error("compiling cycle");
	// 		}
	// 	}
	// }
	// protected compileExpr(): Value {
	// 	let value = this.source.getAttribute("value") || "";
	// 	if (!value) return;
	// 	let compilable = parse(lex(value));
	// 	return compilable.compile(this.scope);
	// }

function compile(stmt: Statement) {
	return new Impure(undefined, null);
}

function compileBlock(stmt: Statement): Value {
	switch (blockType(stmt.content)) {
		case "object":
			return compileObject(stmt);
		case "fn":
		case "expr":
		case "":
	}
	return new Pure(undefined, Object.create(null));
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
	let type = source.scope.getType("object");
	let pure = Pure.object(object);
	return pure ? new Pure(type, pure) : new Impure(type, object);
}

function compileFunction(stmt: Statement) {
}
/*
	Target:
*/