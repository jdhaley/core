import { Signal } from "../../api/signal.js";
import { Response } from "../../base/message.js";
import {extend} from "../../base/util.js";

import {UserEvent} from "../display.js";
import {Editor} from "../editor.js";
import article from "./article.js";

import {adjustRange, getElement} from "../editing.js";

let UNDONE = false;
export default extend(article, {
	save(this: Editor, signal: UserEvent | Response<string>) {
		signal.subject = "";
		if (signal instanceof Response) {
			console.log("Saved: ", signal);
			return;
		}
		let model = this.type.toModel(this.view, null);
		console.log(model);
		this.service.save(this.data.file, JSON.stringify(model, null, 2), this);
	},
	input(event: UserEvent) {
		/*
		Input events should always be undone because the editor maintains its own
		command buffer and allowing a change to the article that doesn't propagate through
		the editor will break the command buffer. The editor traps most changes but some can't be
		such as the user selecting "Undo" directly from the Browser Menu.

		Unfortuneately, input events can't be cancelled so hack it by undoing it. We also keep it
		clean to handle recursive events being trigger.
		*/
		event.subject = "";
		if (UNDONE) {
			UNDONE = false;
		} else {
			UNDONE = true;
			console.debug("undo input");	
			document.execCommand("undo");
		}
	},
	undo(this: Editor, event: UserEvent) {
		event.subject = "";
		this.buffer.undo();
	},
	redo(this: Editor, event: UserEvent) {
		event.subject = "";
		this.buffer.redo();
	},
	copy(this: Editor, event: UserEvent) {
		event.subject = "";
		let range = this.owner.selectionRange;
		range = adjustRange(range, getElement(range, "list"))
		let nodes = this.owner.createNodes(range);
		event.clipboardData.setData("text/html", removeIds(nodes));
	},
	cut(this: Editor, event: UserEvent) {
		event.subject = "";
		let range = this.owner.selectionRange;
		if (range.collapsed) return;

		let nodes = this.owner.createNodes(range);
		event.clipboardData.setData("text/html", removeIds(nodes));
		range = this.edit("Cut", range, "");
		range.collapse();
	},
	paste(this: Editor, event: UserEvent) {
		event.subject = "";
		let range = this.owner.selectionRange;
		let data = event.clipboardData.getData("text/html");
		range = this.edit("Paste", range, data);
		range.collapse();
	},

	charpress(this: Editor, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	},
	promote(this: Editor, event: UserEvent) {
	},
	demote(this: Editor, event: UserEvent) {
	},
	delete(this: Editor, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	},
	erase(this: Editor, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	},
	enter(this: Editor, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	},
});


function removeIds(nodes: Node[]) {
	let out = "";
	for (let node of nodes) {
		if (node instanceof HTMLElement) {
			delete node.id;
			console.log(node.nodeName);
			out += node.outerHTML;
		}
	}
	return out;
}