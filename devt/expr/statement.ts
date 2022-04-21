import {Value, Type} from "../../api/value.js";
import {EMPTY} from "../../base/data.js";
import {Scope} from "../../base/compiler.js";
import lex from "./lexer.js";
import parse from "./parser.js";

const COMPILING = Object.freeze(Object.create(null));

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
	
	get note() {
		return this.source.getElementsByTagName("note").item(0);
	}
	get scope() {
		return this.parent?.scope || null;
	}
	getValue(): Value {
		if (this.#value === undefined) {
			this.#value = COMPILING;
			this.#value = this.compile();
		}
		return this.#value;
	}
	initialize() {
		let source = this.source;
		for (let child of source.children) {
			if (child.nodeName == "s") {
				let stmt = this.createChild(child);
				this.content.push(stmt);
				stmt.initialize();
			} else if (child.nodeName == "note") {
			} else {
				let err = new Statement(child, this);
				this.scope.notice("error", `invalid child node "<${child.nodeName}>"`, err);
			}
		}
	}

	private createChild(child: Element) {
		if (child.getAttribute("key")) return new Declaration(child, this);
		if (child.getAttribute("keyword")) return new KeywordStatement(child, this);
		return new ExpressionStatement(child, this);
	}
	protected compile(): any {
		for (let stmt of this.content) {
			if (stmt.getValue() == COMPILING) {
				throw new Error("compiling cycle");
			}
		}
		let value = this.source.getAttribute("value") || "";
		let compilable = parse(lex(value));
		return compilable.compile(this.scope);
	}
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
	}
}
export class Declaration extends Statement {
	initialize() {
		let source = this.source;
		this.key = source.getAttribute("key");
		let facets = source.getAttribute("facets");
		this.facets = facets ? facets.split(" ") : EMPTY.array as string[];
		super.initialize();
	}
	facets: string[];
	key: string;
	type: Type;
	compile(): any {
	}

}

export class KeywordStatement extends Statement {
	compile(): any {
	}
}

export class ExpressionStatement extends Statement {
}
