import {Value, Type} from "../../api/value.js";
import {Scope, Statement} from "../../base/compiler.js";
import {Impure, Pure} from "../../base/pure.js";
import {EMPTY} from "../../base/data.js";

import lex from "./lexer.js";
import parse from "./parser.js";

export class Stmt extends Statement {
	protected compile(): Value {
		let value = this.source.getAttribute("value") || "";
		if (!value) return;
		let compilable = parse(lex(value));
		return compilable.compile(this.scope);
	}
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
}

export class KeywordStatement extends Stmt {
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
	protected compile(): Value {
		for (let stmt of this.content) {
			if (stmt instanceof Declaration) this.scope.put(stmt.key, stmt);
		}
		for (let stmt of this.content) {
			if (stmt.getValue() == Statement.COMPILING) {
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
		super.initialize();
	}
	key: string;
	facets: string[];
	get type(): Type {
		return this.getValue().type;
	}
	get pure(): any {
		let value = this.getValue();
		return value == this ? undefined : value.pure;
	}
	protected compile(): Value {
		let expr = super.compile();
		if (expr) {
			if (this.content.length) {
				return this.scope.notice("warn", "Both content & expression are not allowed.", expr);
			}
			return expr;
		}
		if (this.content.length) {
			return compileBlock(this);
		}
		return this;
	}
}

type blockType = "object" | /*"array" |*/ "fn" | "expr" | "";
function blockType(stmt: Statement): blockType {
	let type: blockType = "";
	for (let content of stmt.content) {
		if (content instanceof Declaration) {
			if (type == "expr") return "fn";
			type = "object";
		} else if (content instanceof KeywordStatement) {
			return "fn"
		} else {
			if (type) return "fn";
			type = "expr";
		}
	}
	return type;
}
	// protected compileStatements(): void {
	// 	for (let stmt of this.content) {
	// 		if (stmt.getValue() == Statement.COMPILING) {
	// 			throw new Error("compiling cycle");
	// 		}
	// 	}
	// }

function compileBlock(stmt: Stmt): Value {
	switch (blockType(stmt)) {
		case "object":
			return compileObject(stmt);
		case "fn":
		case "expr":
		case "":
	}
	return stmt as Value;
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
		if (stmt.getValue() == Statement.COMPILING) {
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