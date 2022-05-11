import {Entity, Markup} from "../api/model.js";

export function markupAttrs(entity: Entity) {
	let markup = "";
	for (let key of entity.keys()) {
		let value = markupText("" + entity.at(key), true);
		markup += ` ${key}="${value}"`;
	}
	return markup;
}

export function markupText(text: string, quote?: boolean): string {
	let markup = "";
	for (let ch of text) {
		switch (ch) {
			case ">": markup += "&gt;"; break;
			case "<": markup += "&lt;"; break;
			case "&": markup += "&amp;"; break;
			case "\"": markup += quote ? "&quot;" : ch; break;
			default:  markup += ch; break;
		}
	}
	return markup;			
}

export function markupContent(content: Iterable<Markup>): string {
	let markup = "";
	for (let item of content) markup += item.markup;
	return markup;
}