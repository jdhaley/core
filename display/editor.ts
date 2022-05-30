import {Command, CommandBuffer} from "../base/command.js";
import { markup } from "../base/dom.js";
import {Article} from "./display.js";
import {getElement, getItem, getId, getItemContent, getItemRange, mark, unmark,  adjustRange, mungeText} from "./editing.js";

let TRACK = null;

export type replacer = (start: Element, content: Element, end: Element) => string;

export class Editor extends Article {
	readonly buffer = new CommandBuffer<Range>();
	edit(name: string, range: Range, replacement: string, replacer?: replacer) {
		TRACK = null;
		let cmd = new EditCommand(this, name);
		this.buffer.add(cmd);
		let ele = this.owner.createElement("div");
		ele.innerHTML = replacement;
		range = cmd.do(range, ele, replacer);
		console.log(cmd.items);
		return range;
	}
	textEdit(name: string, range: Range, replacement: string, offset: number) {
		let cmd = this.buffer.peek() as EditCommand;
		if (cmd.name == name && TRACK == range.commonAncestorContainer) {
		} else {
			TRACK = range.commonAncestorContainer;
			cmd = new EditCommand(this, name);
			this.buffer.add(cmd);
			unmark(range, "edit");
			range.collapse(); //TODO more analysis of the unmark logic.
		}
		cmd.items.after = editText(range, replacement, offset);
		return range;
	}
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

	do(range: Range, replacement: Element, replacer: replacer) {
		startEdit(this, range);
		let context = this.article.owner.document.getElementById(this.items.contextId);
		let startContent = getItemContent(this.article, "start", context);
		let endContent = getItemContent(this.article, "end", context);
		if (!replacer) replacer = split;
		this.items.after = replacer(startContent, replacement, endContent);
		return this.exec(this.items.after);
	}
	undo() {
		return this.exec(this.items.before);
	}
	redo() {
		return this.exec(this.items.after);
	}

	protected exec(markup: string): Range {
		let range = getItemRange(this.article.owner.document, this.items.contextId, this.items.startId, this.items.endId);
		range.deleteContents();
	
		let nodes = this.article.owner.createNodes(markup);
		for (let i = 0; i < nodes.length; i++) {
			range.insertNode(nodes[i]);
			range.collapse();
		}
		range = unmark(range, "edit");
		if (range) this.article.owner.selectionRange = range;
		return range;
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

function startEdit(cmd: EditCommand, range: Range) {
	let list = getElement(range, "list");
	if (!list) throw new Error("Range outside an editable region.");
	cmd.items.contextId = getId(list);

	let doc = list.ownerDocument;

	range = adjustRange(range, list);
	mark(range, "edit");

	/*
	Expand the range to encompass the whole start/end items or markers (when 
	a marker is a direct descendent of the list).
	*/
	let start = getItem(doc.getElementById("start-edit"), list);
	range.setStartBefore(start);

	let end = getItem(doc.getElementById("end-edit"), list);
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

function editText(range: Range, replacement: string, offset: number): string {
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

/* split is the default replacer */
function split(startContent: Element, replacement: Element, endContent: Element) {
	let markupText = (startContent ? startContent.outerHTML : "<i id='start-edit'></i>") + replacement.innerHTML;
	markupText += endContent ? endContent.outerHTML : "<i id='end-edit'></i>";
	return markupText;
}
