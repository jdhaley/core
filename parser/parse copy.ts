import { Expr } from "../../lang/compiler/compilers/expr.js";
import {Transformer} from "../base/transform.js";
import {Source, Branch, Leaf} from "./source.js";

export const parser: Transformer<string, Source> = {
	transform(source: string): Source {
		let expr = new EXPR();
		expr.parse(source);
		return expr;
	},
	target(source: Source): string {
		return source.textContent;
	}
}

/*
	CONSTRUCTS:

	stmt: (token* ':')? token*
	token:	string | number | ident | '=' | index | exprs
	index: '[' token* ']'
	exprs: '(' (token* ',')* token* ')'

	punct: ': = [ ] ( ) ,'
 */

const KEYWORD = ["if", "else", "while", "return"];

const LETTER = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
const DIGIT = "0123456789";

// "~\\\"'`"
const LETR = "$_";
const DELIM= "\""

const MATH = "+*-/%";
const REL = "=<>&|^";

const GRP = "[]{}()";
const PUNCT = ".,:;?!";
const ACCESS = "@#";
const STOP = ")],"
const SYM = ":=^";

class EXPR extends Branch {
	get nodeName() {
		return "expr";
	}
	get textContent(): string {
		let text = "";
		for (let node of this.children) {
			let next = node.textContent;
			let delim = text ? " " : "";
			if (next.startsWith("(") || next.startsWith("[")) delim = "";
			text += delim + next;
		} 
		return text;
	}
	parse(text: string, start?: number): number {
		let end = parsePrimaries(this, text, start || 0);
		while (end < text.length) {
			let ch = text.at(end);
			if (ch == "\t" || ch == " ") {
				end++;
			} else if (SYM.indexOf(ch) >= 0) {
				if (this.children.at(0)?.nodeName != "expr") {
					let expr = new EXPR();
					expr.children = this.children;
					this.children = [];
					this.children.push(expr);		
				}
				let expr = new EXPR();
				this.children.push(expr);
				let sym = new SYMBOL();
				expr.children.push(sym);
				end = sym.parse(text, end);
				end = parsePrimaries(expr, text, end);
			// } else if (ch == ":") {
			// 	let decl = new DECL()
			// 	for (let child of this.children) decl.children.push(child);
			// 	this.children.length = 0;
			// 	this.children.push(decl);
			// 	end++;
			} else {
				return end;
			}
		}
	}
}

function parsePrimaries(expr: EXPR, text: string, start: number): number {
	let end = start || 0;
	while (end < text.length) {
		let ch = text.at(end);
		if (ch == "\t" || ch == " ") {
			end++;
		} else if (DIGIT.indexOf(ch) >= 0 || ch == "-") {
			end = expr.parseToken(new NUMBER(), text, end);
		} else if (LETTER.indexOf(ch) >= 0) {
			end = expr.parseToken(new ID(), text, end);
		} else if (ch == "\"") {
			end = expr.parseToken(new STRING(), text, end);
		} else if (ch == "(") {
			end = expr.parseToken(new EXPRS(), text, end);
		} else if (ch == "[") {
			end = expr.parseToken(new INDEX(), text, end);
		} else {
			return end;
		}
	}
}

class OP extends Branch {
	get nodeName(): string {
		return "op";
	}
}

class INDEX extends EXPR {
	get nodeName() {
		return "index";
	}
	get textContent(): string {
		return "[" + super.textContent + "]"
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		if (text.at(end) != "[") return end;
		end = super.parse(text, ++end);
		if (text.at(end) == "]") {
			return ++end;
		}
		let error = new ERROR(`expecting "]" but found "${text.at(end)}" instead.`, text.substring(end));
		this.children.push(error);
		return text.length;
	}
}

class EXPRS extends Branch {
	get nodeName() {
		return "exprs";
	}
	get textContent(): string {
		let text = "";
		for (let node of this.children) text += ", " + node.textContent;
		return text.length ? "(" + text.substring(2) + ")" : text;
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		if (text.at(end) != "(") return end;

		let expr = new EXPR();
		end = expr.parse(text, ++end);
		this.children.push(expr);
		while (end < text.length) {
			let ch = text.at(end);
			if (ch == ",") {
				let expr = new EXPR();
				end = expr.parse(text, ++end);
				this.children.push(expr)
			} else if (ch == ")") {
				return ++end;
			} else {
				break;
			}
		}
		let error = new ERROR(`expecting ["," | ")"] but found "${text.at(end)}" instead.`, text.substring(end));
		this.children.push(error);
		return text.length;
	}
}

class SYMBOL extends Leaf {
	get nodeName() {
		return "sym";
	}
	parse(text: string, start?: number): number {
		let end = (start || 0) + 1;
		this.textContent = text.substring(start, end);
		return end;
	}
}

class ID extends Leaf {
	get nodeName() {
		return "id";
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		while (end < text.length) {
			let ch = text.at(end);
			if (LETTER.indexOf(ch) >= 0) {
				end++;
			} else if (end > start && DIGIT.indexOf(ch) >= 0) {
				end++;
			} else {
				break;
			}
		}
		this.textContent = text.substring(start, end);
		return end;
	}
}

class NUMBER extends Leaf {
	get nodeName() {
		return "number";
	}
	get pure() {
		return JSON.parse(this.textContent);
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		while (end < text.length) {
			let ch = text.at(end);
			if (DIGIT.indexOf(ch) >= 0) {
				end++;
			} else if (ch == "." || ch == "-") {
				end++;
			} else {
				break;
			}
		}
		this.textContent = text.substring(start, end);
		return end;
	}
}

class STRING extends Leaf {
	get nodeName() {
		return "string";
	}
	get pure() {
		return JSON.parse(this.textContent);
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		if (text.at(end) != "\"") return end;
		++end;
		while (end < text.length) {
			if (text.at(end) == "\"" && text.at(end - 1) != "\\") {
				this.textContent = text.substring(start, ++end);
				return end;
			};
			++end;
		}
		this.textContent = text.substring(start) + "\""
		this.error = "unterminated";
		return end;
	}
}

class ERROR extends Leaf {
	constructor(error: string, source?: string) {
		super();
		this.error = error;
		this.textContent = source || "";
	}
	get nodeName() {
		return "error";
	}
}

