import {Markup} from "../../api/model.js";
import {Signal} from "../../api/signal.js";
import {Response} from "../../base/message.js";
import {extend} from "../../base/util.js";

import {Article, UserEvent} from "../display.js";
import editor from "./editor.js";

export default extend(editor, {
	open(this: Article, msg: Response<string>) {
		this.model = msg.statusCode == 404 ? "" : msg.body;
		this.dataset.file = msg.req.to;
		this.send("draw");
		this.send("view");
	},
	save(this: Article, signal: UserEvent | Response<string>) {
		if (signal instanceof Response) {
			console.log("Saved: ", signal);
			return;
		}
		signal.subject = "";
		this.service.save(this.dataset.file, (this.model as Markup).markup, this);
	},
	draw(this: Article, msg: Signal) {
		this.element["$editor"] = this;
		this.view.contentEditable = "true";	
	},
	view(this: Article, msg: Signal) {
		this.transform(this.model, this);
		msg.subject = "";

	},
	selectAll(this: Article, event: UserEvent) {
		event.subject = "";
		let range = this.owner.selectionRange;
		range.selectNodeContents(this.element)
	},
	undo(this: Article, event: UserEvent) {
		event.subject = "";
		let range = this.buffer.undo();
		if (range) this.owner.selectionRange = range;
	},
	redo(this: Article, event: UserEvent) {
		event.subject = "";
		let range = this.buffer.redo();
		if (range) this.owner.selectionRange = range;
	}
});

/*
	selectionchange(this: Display, msg: UserEvent) {
		for (let ele of this.owner.document.getElementsByClassName("active")) {
			if (ele.getAttribute("class") == "active") {
				ele.removeAttribute("class");
			} else {
				(ele as HTMLElement).classList.remove("active");
			}
		}		
		let range = this.owner.selectionRange;
		if (range.collapsed) {
			let ele = range.commonAncestorContainer as HTMLElement;
			while (ele && ele.nodeType != Node.ELEMENT_NODE) ele = ele.parentElement;
			ele?.classList.add("active");
			ele?.scrollIntoView({behavior: "auto", block: "nearest", inline: "nearest"});
		}
	},
*/