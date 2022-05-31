import {Article} from "./display.js";

export function getElement(node: Node | Range, type: string): Element {
	console.log(type);
	if (node instanceof Range) node = node.commonAncestorContainer;
	while (node) {
		if (node instanceof HTMLElement && type == node.dataset.model) {
			return node as Element;
		}
		node = node.parentNode;
	}
}

export function getItem(node: Node | Range, context?: Element): Element {
	if (node instanceof Range) node = node.commonAncestorContainer;
	let items = getElement(context || node, "list");
	if (items) while (node) {
		if (node instanceof Element && node.parentElement == items) {
			return node;
		}
		node = node.parentElement;
	}
}

export function getItemRange(document: Document, contextId: string, startId: string, endId: string) {
	let context = document.getElementById(contextId);
	if (!context) throw new Error("Can't find context element.");

	let range = document.createRange();
	range.selectNodeContents(context);
	if (startId) {
		let start = document.getElementById(startId);
		if (!start) throw new Error(`Start item.id '${startId}' not found.`);
		range.setStartAfter(start);
	}
	if (endId) {
		let end = document.getElementById(endId);
		if (!end) throw new Error(`End item.id '${endId}' not found.`);
		range.setEndBefore(end);
	}
	return range;
}

export function getItemContent(article: Article, point: "start" | "end", context: Element): Element {
	let owner = article.owner;
	let doc = owner.document;
	
	let edit = doc.getElementById(point + "-edit");
	let item = getItem(edit, context);
	if (item == edit) return;

	let range = doc.createRange();
//	item = item.cloneNode(true) as Element
	range.selectNodeContents(item);
	point == "start" ? range.setStartAfter(edit) : range.setEndBefore(edit);
	range.deleteContents();
	console.log(point, item.outerHTML);
	return item;
}

export function mark(range: Range, suffix: string) {
	insertMarker(range, "end", suffix);
	insertMarker(range, "start", suffix);
}
/**
 * Removes the start or end point, joining two adjacent text nodes if needed.
 */
 export function unmark(range: Range, suffix: string) {
	let doc = range.commonAncestorContainer.ownerDocument;
	//Patch the replacement points.
	let pt = patchPoint(doc.getElementById("start-" + suffix));
	if (pt) range.setStart(pt.startContainer, pt.startOffset);
	pt = patchPoint(doc.getElementById("end-" + suffix));
	if (pt) range.setEnd(pt.startContainer, pt.startOffset);
	return range;
}

/**
 * Adjusts the range to before/after the context if the range
 * is before/after any significant text.
 */
 export function adjustRange(range: Range, context: Element) {
	range = range.cloneRange();
	let start = getItem(range.startContainer, context);
	let end = getItem(range.endContainer, context);
	if (start) {
		let adjust = adj(start, range.startContainer, range.startOffset);
		range.setStart(adjust.startContainer, adjust.startOffset);
	}
	if (end) {
		let adjust = adj(end, range.endContainer, range.endOffset);
		range.setEnd(adjust.endContainer, adjust.endOffset);
	}
	return range;
}

function extractText(range: Range): string {
	let frag = range.cloneContents();
	let div = range.commonAncestorContainer.ownerDocument.createElement("div");
	while (frag.firstChild) {
		div.append(frag.firstChild);
	}
	return div.textContent;
}

function isWs(text: string) {
	for (let ch of text) {
		switch (ch) {
			case " ":
			case "\u200b":
				break;
			default:
				return false;
		}
	}
	return true;
}

function adj(context: Element, child: Node, offset: number): Range {
	let range = context.ownerDocument.createRange();
	range.selectNodeContents(context);
	range.setEnd(child, offset);
	let txt = extractText(range);
	if (isWs(txt)) {
		range.setStartBefore(context);
		range.collapse(true);
		return range;
	}
	range.selectNodeContents(context);
	range.setStart(child, offset);
	txt = extractText(range);
	if (isWs(txt)) {
		range.setEndAfter(context);
		range.collapse();
		return range;
	}
	range.setEnd(child, offset);
	range.collapse();
	return range;
}

function patchPoint(point: ChildNode) {
	if (!point) return;
	let range = point.ownerDocument.createRange();
	if (point.previousSibling && point.previousSibling.nodeType == Node.TEXT_NODE &&
		point.nextSibling && point.nextSibling.nodeType == Node.TEXT_NODE
	) {
		let offset = point.previousSibling.textContent.length;
		point.previousSibling.textContent += point.nextSibling.textContent;
		range.setStart(point.previousSibling, offset);
		range.collapse(true);
		point.nextSibling.remove();
	} else {
		range.setStartBefore(point);
		range.collapse(true);
	}
	point.remove();
	return range;
}

function insertMarker(range: Range, point: "start" | "end", suffix: string) {
	let marker = range.commonAncestorContainer.ownerDocument.createElement("I");
	marker.id = point + "-" + suffix;
	range = range.cloneRange();
	range.collapse(point == "start" ? true : false);
	range.insertNode(marker);
	return marker;
}


interface Munged {
	text: string,
	offset: number
}

export function mungeText(text: string, offset: number): Munged {
	let out = "";
	for (let i = 0; i < text.length; i++) {
		let ch = text.charAt(i);
		switch (ch) {
			case "\t":
			case "\n":
	
			case " ":
			case "\xa0":
				if (out.length && out.charAt(out.length - 1) != " ") {
					out += " ";
				} else {
					if (i < offset) offset--;
				}
				break;
			case "\r":
				if (i <= offset) offset--;
				break;
			default:
				out += ch;
				break;
		}
	}
	if (out.endsWith(" ")) out = out.substring(0, out.length - 1) + "\xa0";
	return {
		text: out,
		offset: offset
	};
}
