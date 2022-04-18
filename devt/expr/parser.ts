import {Bundle, Markup} from "../../api/model";
import {Compilable} from "../../base/compiler";
import {At, Const, Err, Expr, Exprs, Msg} from "./expr";

export default function parse(source: Markup): Compilable {
	let xform = parsers[source.name];
	return xform ? xform(source) : new Err(`Unknown source node "${source.name}"`, source);
}

function parseSources(source: Iterable<Markup>): Compilable[] {
	let target: Compilable[] = [];
	for (let child of source) {
		let comp = parse(child);
		target.push(comp);
	}
	return target;
}

type parser = (source: Markup) => Compilable;

const parsers: Bundle<parser> = {
	expr(source: Markup) {
		return new Expr(parseSources(source.content));
	},
	// type(source: Markup) {
	// 	let children = compilableSources(source.content);
	// 	return new TYPE(children);
	// },	
	index(source: Markup) {
		let children = parseSources(source.content);
		let expr = children.length == 1 ? children.at(0) : new Expr(children)
		return new At(expr);
	},
	exprs(source: Markup) {
		let children = parseSources(source.content);
		return new Exprs(children);
		// for (let child of children) {
		// 	if (child instanceof Declaration == false) return new Exprs(children);
		// }
		// return new TUPLE(children as Declaration[]);
	},
	sym(source: Markup) {
		return new Msg(source.textContent);
	},
	id(source: Markup) {
		return new Msg(source.textContent);
	},
	number(source: Markup) {
		let num = Number.parseFloat(source.textContent);
		return isNaN(num) 
			? new Err(`Invalid numeric source "${source.textContent}"`, source)
			: new Const(num);
	},
	string(source: Markup) {
		let str = JSON.parse(source.textContent);
		return new Const(str);
	},
	error(source: Markup) {
		return new Err(source.textContent, source);
	}
}



// function compilableDecl(source: Markup): Markup {
// 	let content = source.content as Source[];
// 	let decl = content.shift();
// 	let children = compilableSources(content.slice(1));
// 	let keyword = keywordOf(decl);
// 	if (keyword) return new KeyStmt(keyword, new Expr(children));

// 	let key = decl.content.at(-1).textContent;
// 	let facet = parseFacets(decl);
// 	let type: any = children.at(0) instanceof TYPE ? children.shift() : null;
// 	return new Declaration(key, facet, type as TYPE, new Expr(children));
// }

// function parseFacets(value: Markup): string[] {
// 	let facets = [];
// 	for (let facet of value.content) facets.push(facet.textContent);
// 	return facets;
// }

// function keywordOf(lhs: Markup) {
// 	switch (lhs.textContent) {
// 		case "if":
// 		case "else":
// 		case "while":
// 		case "return":
// 		case "switch":
// 		case "case":
// 			return lhs.textContent;
// 		case "else if":
// 			return "else_if";
// 	}
// 	return "";
// }
