import {Markup} from "../api/model.js";
import {Consumer} from "../api/resource.js";
import {content, EmptyMarkup, TextContent} from "./markup.js";

const IMMUTABLE_ARRAY = {
	set() {
		throw new Error("Immutable Array");
	}
}

export class Bag extends EmptyMarkup implements Consumer<content> {
	// constructor() {
	// 	super();
	// 	//create an immutable proxy for "content", overridding the TS/class inheritence
	// 	//Object.defineProperty(this, "content", {value: new Proxy(this.#content, IMMUTABLE_ARRAY)})
	// }
	#content: Markup[] = [];
	get content(): Markup[] {
		return this.#content;
	}
	get textContent(): string {
		return super.textContent;
	}
	set textContent(text: string) {
		this.clear();
		this.append(new TextContent(text));
	}
	append(...values: content[]): void {
		for (let value of values) {
			this.#content.push(typeof value == "string" ? new TextContent(value) : value);
		}
	}
	clear(): void {
		this.#content.length = 0;
	}
	parse(source: string, start: number): number {
		this.append(new TextContent(source.substring(start)));
		return source.length;
	}
}
