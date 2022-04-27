import {Bundle, Markup} from "../../api/model.js";
import {Compilable} from "../../base/compiler.js";
import {At, Const, Err, Expr, Exprs, Msg} from "./expr.js";

type parser = (source: Markup) => Compilable;

export default function parse(source: Markup): Compilable {
	let parse = parsers[source.name];
	return parse ? parse(source) : new Err(`Unknown source node "${source.name}"`, source);
}

function parseSources(source: Iterable<Markup>): Compilable[] {
	let target: Compilable[] = [];
	for (let child of source) {
		let comp = parse(child);
		target.push(comp);
	}
	return target;
}

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
