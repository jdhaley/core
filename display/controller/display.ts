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
		let command = this.shortcuts[event.shortcut];
		if (command) event.subject = command;
	}
});