import {Value, Type} from "../../api/value.js";
import {EMPTY} from "../../base/data.js";
import {Compilable, Scope} from "../../base/compiler.js";
import {Markup} from "../../api/model.js";
import lex from "./lexer.js";
import parse from "./parser.js";
import { Decl } from "../../../lang/compiler/compiler.js";

type state = "initialized" | "compiling" | "compiled";
export class Statement  {
	constructor(source: Element, parent?: Statement) {
		this.source = source;
		this.parent = parent;
		this.content = source.children.length ? [] : EMPTY.array as any[];
	}
	#state: state;
	#value: Value;
	readonly source: Element;
	readonly parent: Statement;
	readonly content: Statement[];
	
	get comment() {
		return this.source.getElementsByTagName("section").item(0);
	}
	get scope() {
		return this.parent?.scope || null;
	}

	compile() {
		switch (this.#state) {
			case "compiling":
				throw new Error("compilation cycle");
			case "compiled":
				return;
			default:
				break;
		}
		for (let stmt of this.content) {
			stmt.compile();
		}
		let value = this.source.getAttribute("value") || "";
		let compilable = parse(lex(value));
		this.#value = compilable.compile(this.scope);
	}
	initialize() {
		let source = this.source;
		// this.source = lex(source.getAttribute("value") || "");
		// this.expr = parse(stmt.source);

		//if (stmt instanceof Declaration) ...
		for (let child of source.children) {
			if (child.nodeName == "s") {
				let stmt = child.getAttribute("key")
					? new Declaration(child, this)
				 	: new Statement(child, this);
				this.content.push(stmt);
				stmt.initialize();
			} else {
				let err = new Statement(child, this);
				this.scope.notice("error", `invalid child node "<${child.nodeName}>"`, err);
			}
		}
		this.#state = "initialized";
	}
}
export class Module extends Statement {
	constructor(source: Element) {
		super(source);
		this.#scope = new Scope();
	}
	#scope: Scope;
	get scope(): any {
		return this.#scope;
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
}