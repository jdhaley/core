import {Signal, Response} from "../../api/signal.js";

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
		let target = this.transform.target(this.view) as Element;
		this.owner.origin.save(this.dataset.file, target.outerHTML, this);
	},
	draw(this: Article, msg: Signal) {
		this.view["$editor"] = this;
		this.setEditable(true);
	},
	view(this: Article, msg: Signal) {
		let div = this.owner.document.createElement("DIV");
		div.innerHTML = this.model;
		this.view.innerHTML = this.transform.transform(div).innerHTML;
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