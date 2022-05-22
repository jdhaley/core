import {Command} from "../base/command.js";
import { markup } from "../base/dom.js";
import {Article} from "./display.js";
import {getElement, getItem, getId, getItemContent, getItemRange, mark, unmark,  adjustRange, mungeText} from "./editing.js";

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

function startEdit(cmd: EditCommand, range: Range) {
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

function replace(cmd: EditCommand, markupText: string, split: boolean): Range {
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