import {Token, Branch, Leaf} from "./token.js";

const KEYWORD = ["if", "else", "while", "return"];

/*
	CONSTRUCTS:

	stmt: (token* ':')? token*
	token:	string | number | ident | '=' | index | exprs
	index: '[' token* ']'
	exprs: '(' (token* ',')* token* ')'

	punct: ': = [ ] ( ) ,'
 */

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
const SYM = "=^"; 

export class SOURCE extends Branch {
	get nodeName(): string {
		return "s";
	}
	key: Token;
	facets: Token;
	expr: Token
	parse(text: string, start?: number): number {
		let end = start || 0;
		let expr = new EXPR();
		end = expr.parse(text, end);
		if (text.at(end) == ":") {
			this.key = expr.children.pop();
			this.facets = expr;
			expr = new EXPR()
			end = expr.parse(text, ++end);
		} else if (TERM.indexOf(text.at(end)) < 0 && end != text.length) {
			let error = new ERROR("Unexpected character", text.substring(end));
			expr.children.push(error);
			end = text.length;
		}
		this.expr = expr;
		return end;
	}
}

class EXPR extends Branch {
	get nodeName() {
		return "expr";
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		while (end < text.length) {
			let ch = text.at(end);
			if (ch == "\t" || ch == " ") {
				end++;
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
}


class INDEX extends EXPR {
	get nodeName() {
		return "index";
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
	get textContent(): string {
		return "[" + super.textContent + "]"
	}
}

class EXPRS extends Branch {
	get nodeName() {
		return "exprs";
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		if (text.at(end) != "(") return end;
		end++;
		let expr: Token = new SOURCE();
		this.children.push(expr);
		while (end < text.length) {
			end = expr.parse(text, end);
			let ch = text.at(end);
			if (ch == ",") {
				expr = new SOURCE();
				this.children.push(expr)
				end = expr.parse(text, ++end);
			} else if (ch == ")") {
				return ++end;
			} else {
				break;
			}
		}
		expr = new ERROR(`expecting ["," | ")"] but found "${text.at(end)}" instead.`, text.substring(end));
		this.children.push(expr);
		return text.length;
	}
	get textContent(): string {
		let text = "";
		for (let node of this.children) text += ", " + node.textContent;
		return text.length ? "(" + text.substring(2) + ")" : text;
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