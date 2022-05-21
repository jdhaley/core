import {markup} from "../base/dom.js";
import {Command} from "../base/command.js";
import {Article} from "./display.js";

let TRACK = null;

export class Editor extends Article {
	edit(name: string, range: Range, replacement: string) {
		TRACK = null;
		let cmd = new EditCommand(this, name);
		startEdit(cmd, range);
		range = replace(cmd, replacement, true);
		console.log(cmd.items);
		this.buffer.add(cmd);
		return range;
	}
	// textEdit(name: string, range: Range, replacement: string, offset: number) {
	// 	let cmd = this.buffer.peek() as EditCommand;
	// 	if (cmd.name == name && TRACK == range.commonAncestorContainer) {
	// 	} else {
	// 		TRACK = range.commonAncestorContainer;
	// 		cmd = new EditCommand(this, name);
	// 		this.buffer.add(cmd);
	// 		unmark(range, "edit");
	// 		range.collapse(); //TODO more analysis of the unmark logic.
	// 	}
	// 	cmd.items.after = editText(range, replacement, offset);
	// 	return range;
	// }
}

class EditCommand extends Command<Range> {
	constructor(article: Article, name: string) {
		super();
		this.article = article;
		this.items = Object.create(null);
		this.items.name = name;
		this.items.timestamp = Date.now();
	}
	article: Article;
	items: Edit;
	get name() {
		return this.items?.name;
	}

	undo() {
		return this.replace(this.items.before);
	}
	redo() {
		return this.replace(this.items.after);
	}
	replace(markup: string): Range {
		let range = getItemRange(this.article.owner.document, this.items.contextId, this.items.startId, this.items.endId);
		range.deleteContents();
	
		let nodes = this.article.owner.createNodes(markup);
		for (let i = 0; i < nodes.length; i++) {
			range.insertNode(nodes[i]);
			range.collapse();
		}
		return unmark(range, "edit");
	}
}

interface Edit {
	name: string;
	timestamp: number;
	contextId: string;
	startId: string;
	endId: string;
	before: string;
	after: string;
}


function getItemRange(document: Document, contextId: string, startId: string, endId: string) {
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

function getItem(node: Node | Range, context?: Element): Element {
	if (node instanceof Range) node = node.commonAncestorContainer;
	let items = getElement(context || node, "collection");
	if (items) while (node) {
		if (node instanceof Element && node.parentElement == items) {
			return node;
		}
		node = node.parentElement;
	}
}

function getElement(node: Node | Range, type: string): Element {
	if (node instanceof Range) node = node.commonAncestorContainer;
	while (node) {
		if (node instanceof HTMLElement && node.classList.contains(type)) {
			return node as Element;
		}  
		node = node.parentNode;
	}
}

let LAST_ID = 0;
function getId(ele: Element): string {
	if (ele.nodeType != Node.ELEMENT_NODE) ele = ele.parentElement;
	if (ele && !ele.id) {
		ele.id = "" + ++LAST_ID;;
	}
	return ele ? ele.id : "";
}

export function startEdit(cmd: EditCommand, range: Range) {
	let collection = getElement(range, "collection");
	if (!collection) throw new Error("Range outside an editable region.");
	cmd.items.contextId = getId(collection);

	let doc = collection.ownerDocument;

	range = adjustRange(range, collection);
	mark(range, "edit");

	/*
	Expand the range to encompass the whole start/end items or markers (when 
	a marker is a direct descendent of the collection).
	*/
	let start = getItem(doc.getElementById("start-edit"), collection);
	range.setStartBefore(start);

	let end = getItem(doc.getElementById("end-edit"), collection);
	range.setEndAfter(end);
	
	//Capture the before image for undo.
	cmd.items.before = markup(range);	

	/*
	Get the items prior to the start/end to identify the id's prior-to-start or
	following-end.
	If the range is at the start or end of the collect they will be undefined.
	*/
	start = start.previousElementSibling;
	if (start) cmd.items.startId = getId(start);

	end = end.nextElementSibling;
	if (end) cmd.items.endId = getId(end);
}

function getItemContent(article: Article, point: "start" | "end", context: Element): Element {
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


export function replace(cmd: EditCommand, markupText: string, split: boolean): Range {
	let owner = cmd.article.owner;
	let doc = owner.document;
	let context = doc.getElementById(cmd.items.contextId);
	let startContent = getItemContent(cmd.article, "start", context);
	let endContent = getItemContent(cmd.article, "end", context);
	if (split) {
		markupText = (startContent ? startContent.outerHTML : "<i id='start-edit'></i>") + markupText;
		markupText += endContent ? endContent.outerHTML : "<i id='end-edit'></i>";
		cmd.items.after = markupText;
		return cmd.replace(cmd.items.after);
	}
	console.error("replace-join not implemented.");
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

/**
 * Adjusts the range to before/after the context if the range
 * is before/after any significant text.
 */
function adjustRange(range: Range, context: Element) {
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
	range.setStart(pt.startContainer, pt.startOffset);
	pt = patchPoint(doc.getElementById("end-" + suffix));
	range.setEnd(pt.startContainer, pt.startOffset);
	return range;
}

function patchPoint(point: ChildNode) {
	if (!point) debugger;
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

function mungeText(text: string, offset: number): Munged {
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
export function editText(range: Range, replacement: string, offset: number): string {
	let munged = mungeText(replacement, offset);
	let txt = range.commonAncestorContainer;
	txt.textContent = munged.text;
	range.setEnd(txt, munged.offset);
	range.collapse();
	mark(range, "edit");
	let after = getItem(txt).outerHTML;
	unmark(range, "edit");
	range.collapse();
	return after;
}