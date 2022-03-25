export interface Token {
	nodeName: string;
	error?: string;
	textContent: string;
	children: Token[];
	/** return the end index. */
	parse(source: string, start?: number): number;
}

export class Branch implements Token {
	constructor() {
		this.children = [];
	}
	error?: string;
	get nodeName(): string {
		return "BRANCH";
	}
	get textContent(): string {
		let text = "";
		for (let node of this.children) text += " " + node.textContent;
		return text.length ? text.substring(1) : text;
	}
	children: Token[];
	parse(source: string, start?: number): number {
		return start || 0;
	}
	parseToken(token: Token, text: string, start: number): number {
		this.children.push(token)
		return token.parse(text, start);
	}
}

const EMPTY_ARR = Object.freeze([]);

export class Leaf implements Token {
	error?: string;
	get nodeName() {
		return "LEAF";
	}
	get children() {
		return EMPTY_ARR as Token[];
	}
	textContent : string;
	parse(text: string, start?: number): number {
		return start || 0;
	}
}