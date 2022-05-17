import {extend} from "../../base/util.js";

import {Display, UserEvent} from "../display.js";
import display from "./display.js";

let UNDONE = false;
export default extend(display, {
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
	cut(this: Display, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	},
	copy(this: Display, event: UserEvent) {
	},
	paste(this: Display, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	},

	charpress(this: Display, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	},
	promote(this: Display, event: UserEvent) {
	},
	demote(this: Display, event: UserEvent) {
	},
	delete(this: Display, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	},
	erase(this: Display, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	},
	enter(this: Display, event: UserEvent) {
		if ((event.target as Element).classList.contains("form")) event.subject = "";
	}
});
