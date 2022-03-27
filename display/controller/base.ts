import {Signal} from "../../base/signal.js";
import {Display, Article, UserEvent} from "../display.js"

import {extend} from "../../base/util.js";

export const displayActions = {
	draw(this: Display, msg: Signal) {
	},
	view(this: Display, msg: Signal) {
		this.model = msg.from["model"];
		this.view.textContent = "" + this.model;
	},
	command(this: Display, event: UserEvent) {
		let command = this.shortcuts[event.shortcut];
		if (command) event.subject = command;
	}
}

export const resourceActions = extend(displayActions, {
	opened(this: Article, msg: any) {
		this.model = msg.status == 404 ? "" : msg.response;
		this.dataset.file = msg.request.url;
		this.send("draw");
		this.send("view");
	},
	saved(this: Article, msg: any) {
		console.log(msg);
	},
	draw(this: Article, msg: UserEvent) {
		this.view["$editor"] = this;
		this.setEditable(true);
	},
	view(this: Article, msg: Signal) {
		let div = this.owner.document.createElement("DIV");
		div.innerHTML = this.model;
		this.view.innerHTML = this.transform.transform(div).innerHTML;
	},
	save(this: Article, event: UserEvent) {
		event.subject = "";
		let target = this.transform.target(this.view) as Element;
		this.owner.origin.save(this, this.dataset.file, target.outerHTML);
	},
	selectAll(this: Article, event: UserEvent) {
		event.subject = "";
		let range = this.owner.selectionRange;
		range.selectNodeContents(this.view)
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