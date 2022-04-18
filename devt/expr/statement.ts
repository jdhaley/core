import {Markup} from "../../api/model.js";
import {Value, Type} from "../../api/value.js";
import {Compilable, Scope } from "./compiler.js";

export class Statement extends Scope implements Compilable, Value {
	parent: Statement;
	content: Statement[]
	model: Element;
	comment: string;
	source: Markup;
	expr: Compilable;
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
	add(element: Element) {
		let stmt = new Statement();
		stmt.parent = this;
		stmt.model = element;
		stmt.source = lex(element.getAttribute("value") || "");
		stmt.expr = parse(stmt.source);
		this.content.push(stmt);
		//if (stmt instanceof Declaration) ...
		for (let child of element.children) parseChild(child, stmt);	
	}
}

import lex from "./lexer.js";
import parse from "./parser.js";

export default function load(xml: Element): Statement {
	let module = new Statement();
	for (let child of xml.children) parseChild(child, module);
	return module;
}

function parseChild(child: Element, stmt: Statement) {
	if (child.nodeName == "s") {
		stmt.add(child);
	} else if (child.nodeName == "section") {
		//add check that comment isn't already assigned.
		stmt.comment = child.innerHTML;
	} else {
		stmt.notice("error", `invalid child node "<${child.nodeName}>"`, stmt);
	}
}
