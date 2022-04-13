import {Transformer} from "../../core/base/transform.js";
import {Markup} from "../base/model.js";
import {MarkupContent, TextContent} from "../base/markup.js";

export const parser: Transformer<string, Markup> = {
	transform(source: string): Markup {
		let expr = new EXPR();
		expr.parse(source);
		return expr;
	},
	target(source: Markup): string {
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

const MATH = "+*-/%";
const REL = "=<>&|^";

const LETR = "$_";
const GRP = "[]{}()";
const PUNCT = ".,:;?!";
const ACCESS = "@#";
// "~\\\"'`"
const TERM = ")],"
const SYM = ":=^";

const EMPTY_ARRAY = Object.freeze([]);

export interface Source extends Markup {
	parse(source: string, start?: number): number;
}

abstract class BR extends MarkupContent {
	parseToken(token: Source, text: string, start: number): number {
		this.add(token)
		return token.parse(text, start);
	}
}

class EXPR extends BR {
	get name() {
		return "expr";
	}
	get textContent(): string {
		let text = "";
		for (let node of this) {
			let next = node.textContent;
			let delim = text ? " " : "";
			if (next.startsWith("(") || next.startsWith("[")) delim = "";
			text += delim + next;
		} 
		return text;
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		while (end < text.length) {
			let ch = text.at(end);
			if (ch == "\t" || ch == " ") {
				end++;
			} else if (ch == ":") {
				end = this.parseDecl(end, text);
			} else if (ch == "^") {
				/*
				The leading "^" is part of the expression (i.e. "cast operator")
				and not the type expression.
				*/
				end = this.parseToken(new TYPE(), text, ++end);
			} else if (DIGIT.indexOf(ch) >= 0 || ch == "-") {
				end = this.parseToken(new NUMBER(), text, end);
			} else if (LETTER.indexOf(ch) >= 0) {
				end = this.parseToken(new ID(), text, end);
			} else if (SYM.indexOf(ch) >= 0) {
				end = this.parseToken(new SYMBOL(), text, end);
			} else if (ch == "\"") {
				end = this.parseToken(new STRING(), text, end);
			} else if (ch == "(") {
				end = this.parseToken(new EXPRS(), text, end);
			} else if (ch == "[") {
				end = this.parseToken(new INDEX(), text, end);
			} else {
				break;
			}
		}
		return end;
	}

	private parseDecl(end: number, text: string) {
		let decl = new DECL();
		for (let child of this)
			decl.add(child);
		this.clear();
		this.add(decl);
		end = this.parseToken(new TYPE(), text, ++end);
		return end;
	}
}
class TYPE extends BR {
	get name() {
		return "type";
	}
	get textContent(): string {
		let text = "";
		for (let node of this) {
			let next = node.textContent;
			let delim = text ? " " : "";
			text += delim + next;
		} 
		return text;
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		while (end < text.length) {
			let ch = text.at(end);
			if (ch == "\t" || ch == " ") {
				end++;
			} else if (ch == "^") {
				end = this.parseToken(new SYMBOL(), text, end);
			} else if (LETTER.indexOf(ch) >= 0) {
				end = this.parseToken(new ID(), text, end);
			} else if (ch == "(") {
				end = this.parseToken(new EXPRS(), text, end);
			} else {
				break;
			}
		}
		return end;
	}
}

class DECL extends MarkupContent {
	get nodeName(): string {
		return "decl";
	}
	get textContent(): string {
		return super.textContent + ":";
	}
}

class INDEX extends EXPR {
	error = "";
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
		this.error = `expecting "]" but found "${text.at(end)}" instead.`;
		return text.length;
	}
}


class EXPRS extends BR {
	error = ""
	get nodeName() {
		return "exprs";
	}
	get textContent(): string {
		let text = "";
		for (let node of this) text += ", " + node.textContent;
		return text.length ? "(" + text.substring(2) + ")" : text;
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		if (text.at(end) != "(") return end;

		let expr = new EXPR();
		end = expr.parse(text, ++end);
		this.add(expr);
		while (end < text.length) {
			let ch = text.at(end);
			if (ch == ",") {
				let expr = new EXPR();
				end = expr.parse(text, ++end);
				this.add(expr)
			} else if (ch == ")") {
				return ++end;
			} else {
				break;
			}
		}
		this.error = `expecting ["," | ")"] but found "${text.at(end)}" instead.`;
		return text.length;
	}
}

class SYMBOL extends TextContent {
	get nodeName() {
		return "sym";
	}
	parse(text: string, start?: number): number {
		let end = (start || 0) + 1;
		this.textContent = text.substring(start, end);
		return end;
	}
}

class ID extends TextContent {
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

class NUMBER extends TextContent {
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

class STRING extends TextContent {
	error = "";
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
