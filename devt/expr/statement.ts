import {Value, Type} from "../../api/value.js";
import {EMPTY} from "../../base/data.js";
import {Scope} from "../../base/compiler.js";
import lex from "./lexer.js";
import parse from "./parser.js";
import { Impure, Pure } from "../../base/pure.js";

const COMPILING = Object.freeze(Object.create(null));

type blockType = "object" | /*"array" |*/ "fn" | "expr" | "";

export class Statement  {
	constructor(source: Element, parent?: Statement) {
		this.source = source;
		this.parent = parent;
		this.content = source.children.length ? [] : EMPTY.array as any[];
	}
	#value: Value;
	readonly source: Element;
	readonly parent: Statement;
	readonly content: Statement[];
	
	get note(): Element {
		return this.source.getElementsByTagName("note").item(0);
	}
	get scope(): Scope {
		return this.parent?.scope || null;
	}
	get blockType(): blockType {
		let type: blockType = "";
		for (let stmt of this.content) {
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
	initialize() {
		let source = this.source;
		for (let child of source.children) {
			if (child.nodeName == "s") {
				let stmt = createChild(this, child);
				this.content.push(stmt);
				stmt.initialize();
			} else if (child.nodeName == "note") {
			} else {
				this.scope.notice("error", `invalid child node "<${child.nodeName}>"`);
			}
		}
	}
	getValue(): Value {
		if (this.#value === undefined) {
			this.#value = COMPILING;
			this.#value = this.compile();
			if (this.#value === undefined) throw new Error();
		}
		return this.#value;
	}
	protected compile(): Value {
		this.compileStatements();
		return this.compileExpr();
	}
	protected compileStatements(): void {
		for (let stmt of this.content) {
			if (stmt.getValue() == COMPILING) {
				throw new Error("compiling cycle");
			}
		}
	}
	protected compileExpr(): Value {
		let value = this.source.getAttribute("value") || "";
		if (!value) return;
		let compilable = parse(lex(value));
		return compilable.compile(this.scope);
	}
}

function createChild(statement: Statement, child: Element) {
	if (child.getAttribute("key")) return new Declaration(child, this);
	if (child.getAttribute("keyword")) return new KeywordStatement(child, this);
	return new ExpressionStatement(child, this);
}

export class ExpressionStatement extends Statement {
}

export class KeywordStatement extends Statement {
}

export class Module extends Statement {
	constructor(source: Element) {
		super(source);
		this.#scope = new Scope();
	}
	#scope: Scope;
	get scope(): Scope {
		return this.#scope;
	}
	protected compile() {
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
export class Declaration extends Statement implements Value {
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
	compile(): any {
		let expr = this.compileExpr();
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

function compileBlock(stmt: Statement) {
	return stmt;
}