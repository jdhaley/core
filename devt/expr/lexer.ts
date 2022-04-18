import {Source} from "../../base/markup";

export default function parse(text: string): Source {
	let expr = new EXPR();
	expr.parse(text);
	return expr;
}

class DECL extends Source {
	get name(): string {
		return "decl";
	}
	get textContent(): string {
		return super.textContent + ":";
	}
}

function parseToken(source: Source, token: Source, text: string, start: number): number {
	source.append(token)
	return token.parse(text, start);
}

/*
	CONSTRUCTS:

	stmt: (token* ':')? token*
	token:	string | number | ident | '=' | index | exprs
	index: '[' token* ']'
	exprs: '(' (token* ',')* token* ')'

	punct: ': = [ ] ( ) ,'

const KEYWORD = ["if", "else", "not", "while", "return"];
const MATH = "+*-/%";
const REL = "=<>&|";

const LETR = "$_";
const PUNCT = ".,:;?!";
const ACCESS = "@#";
// "~\\\"'`"
const TERM = ")],"
const GRP = "[]{}()";
 */

const LETTER = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
const DIGIT = "0123456789";
const SYM = ":=^";

class EXPR extends Source {
	get name() {
		return "expr";
	}
	get textContent(): string {
		let text = "";
		for (let node of this.content) {
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
			let next = this.parseNext(text, end);
			if (next == end) return end;
			end = next;
		}
		return end;
	}
	protected parseNext(text: string, end: number): number {
		let ch = text.at(end);
		switch (ch) {
			case " ":
			case "\t":
				return ++end;
			case ":":
				return this.parseDecl(end, text);
			case "^":
				/*
				The leading "^" is part of the expression (i.e. "cast operator")
				and not the type expression, so advance the end first.
				*/
				return parseToken(this, new TYPE(), text, ++end);
			case "\"":
				return parseToken(this, new STRING(), text, end);
			case "(":
				return parseToken(this, new EXPRS(), text, end);
			case "[":
				return parseToken(this, new INDEX(), text, end);
		}

		if (DIGIT.indexOf(ch) >= 0 || ch == "-") {
			return parseToken(this, new NUMBER(), text, end);
		} else if (LETTER.indexOf(ch) >= 0) {
			return parseToken(this, new ID(), text, end);
		} else if (SYM.indexOf(ch) >= 0) {
			return parseToken(this, new SYMBOL(), text, end);
		}

		return end;
	}
	protected parseDecl(end: number, text: string) {
		let decl = new DECL();
		for (let child of this.content) decl.append(child);
		this.content.length = 0;
		this.append(decl);
		end = parseToken(this, new TYPE(), text, ++end);
		return end;
	}
}

class TYPE extends Source {
	get name() {
		return "type";
	}
	get textContent(): string {
		let text = "";
		for (let node of this.content) {
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
				end = parseToken(this, new SYMBOL(), text, end);
			} else if (LETTER.indexOf(ch) >= 0) {
				end = parseToken(this, new ID(), text, end);
			} else if (ch == "(") {
				end = parseToken(this, new EXPRS(), text, end);
			} else {
				break;
			}
		}
		return end;
	}
}

class INDEX extends EXPR {
	get name() {
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
		this["error"] = `expecting "]" but found "${text.at(end)}" instead.`;
		return text.length;
	}
}

class EXPRS extends Source {
	get name() {
		return "exprs";
	}
	get textContent(): string {
		let text = "";
		for (let node of this.content) text += ", " + node.textContent;
		return text.length ? "(" + text.substring(2) + ")" : text;
	}
	parse(text: string, start?: number): number {
		let end = start || 0;
		if (text.at(end) != "(") return end;

		let expr = new EXPR();
		end = expr.parse(text, ++end);
		this.append(expr);
		while (end < text.length) {
			let ch = text.at(end);
			if (ch == ",") {
				let expr = new EXPR();
				end = expr.parse(text, ++end);
				this.append(expr)
			} else if (ch == ")") {
				return ++end;
			} else {
				break;
			}
		}
		this["error"] = `expecting ["," | ")"] but found "${text.at(end)}" instead.`;
		return text.length;
	}
}

class SYMBOL extends Source {
	get name() {
		return "sym";
	}
	parse(text: string, start?: number): number {
		let end = (start || 0) + 1;
		this.textContent = text.substring(start, end);
		return end;
	}
}

class ID extends Source {
	get name() {
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

class NUMBER extends Source {
	get name() {
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

class STRING extends Source {
	get name() {
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
		this["error"] = "unterminated";
		return end;
	}
}
