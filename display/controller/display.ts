import {Signal} from "../../api/signal.js";
import {extend} from "../../base/util.js";

import {Display, UserEvent} from "../display.js";

export default extend(null, {
	draw(this: Display, msg: Signal) {
	},
	view(this: Display, msg: Signal) {
		this.model = msg.from.model;
		this.element.textContent = "" + this.model;
	},
	command(this: Display, event: UserEvent) {
		if (this.shortcuts) {
			let command = this.shortcuts[event.shortcut];
			if (command) event.subject = command;	
		}
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

	// select(event: UserEvent) {
	// 	console.log(event.subject);
	// 	this.getStyle().setProperty("background-color", "gainsboro");
	// 	event.subject = "";
	// },
	// unselect(event: UserEvent) {
	// 	console.log(event.subject);
	// 	this.getStyle().removeProperty("background-color");
	// 	event.subject = "";
	// },
	// selecting(event: UserEvent) {
	// 	event.subject = "";
	// },
