export interface Source {
	nodeName: string;
	textContent: string;
	readonly outerHTML: string;
	readonly innerHTML: string;
	children: Source[];
	/** return the end index. */
	parse(source: string, start?: number): number;
}

export class Branch implements Source {
	constructor() {
		this.children = [];
	}
	children: Source[];
	error?: string;
	get nodeName(): string {
		return "BRANCH";
	}
	get textContent(): string {
		let text = "";
		for (let node of this.children) text += " " + node.textContent;
		return text.length ? text.substring(1) : text;
	}
	get innerHTML(): string {
		let markup = "";
		for (let node of this.children) markup += node.outerHTML;
		return markup;
	}
	get outerHTML(): string {
		return `<${this.nodeName}>${this.innerHTML}</${this.nodeName}>`;
	}
	parse(source: string, start?: number): number {
		return start || 0;
	}
	parseToken(token: Source, text: string, start: number): number {
		this.children.push(token)
		return token.parse(text, start);
	}
}

const EMPTY_ARR = Object.freeze([]);

export class Leaf implements Source {
	error?: string;
	get nodeName() {
		return "LEAF";
	}
	get children() {
		return EMPTY_ARR as Source[];
	}
	get innerHTML(): string {
		return markupText(this.textContent);
	}
	get outerHTML(): string {
		return `<${this.nodeName}>${this.innerHTML}</${this.nodeName}>`;
	}
	textContent : string;
	parse(text: string, start?: number): number {
		return start || 0;
	}
}

function markupText(text: string) {
	let markup = "";
	for (let ch of text) {
		switch (ch) {
			case ">": markup += "&gt;"; break;
			case "<": markup += "&lt;"; break;
			case "&": markup += "&amp;"; break;
			default:  markup += ch; break;
		}
	}
	return markup;
}