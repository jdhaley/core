import {Value, Type} from "../../api/value.js";
import {EMPTY} from "../../base/data.js";
import {Compilable, Scope} from "../../base/compiler.js";
import {Markup} from "../../api/model.js";
import lex from "./lexer.js";
import parse from "./parser.js";

export class Statement extends Scope implements Compilable, Value {
	constructor(source: Element, parent?: Statement) {
		super();
		this.source = source;
		this.parent = parent;
	}
	readonly source: Element;
	readonly parent: Statement;
	
	content: Statement[]
	comment: string;
	// expr: Markup;
	get scope() {
		return this.parent?.scope || null;
	}
	get type(): Type {
		return undefined;
	}
	get pure(): any {
		return undefined;
	}
	compile(scope: Scope): Value {
		throw new Error("Method not implemented.");
	}
	initialize() {
		let source = this.source;
		this.content = source.children.length ? [] : EMPTY.array as any[];
		// this.source = lex(source.getAttribute("value") || "");
		// this.expr = parse(stmt.source);

		//if (stmt instanceof Declaration) ...
		for (let child of source.children) {
			if (child.nodeName == "s") {
				let stmt = new Statement(child, this);
				this.content.push(stmt);
				stmt.initialize();
			} else if (child.nodeName == "section") {
				//add check that comment isn't already assigned.
				this.comment = child.innerHTML;
			} else {
				let err = new Statement(child, this);
				this.notice("error", `invalid child node "<${child.nodeName}>"`, err);
			}
		}
	}
}
