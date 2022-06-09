import {Signal} from "../../api/signal.js";
import {Response} from "../../base/message.js";
import {extend} from "../../base/util.js";

import {Article, UserEvent} from "../display.js";
import display from "./display.js";

export default extend(display, {
	open(this: Article, res: Response<string>) {
		this.data.file = res.req.to;
		this.model = res.statusCode == 404 ? [] : JSON.parse(res.body);
		this.send("draw");
		this.send("view");
	},
	draw(this: Article, msg: Signal) {
		this.data.model = "list";
		this.view["$type"] = this.type;
		this.view.id = "1";
		this.view.contentEditable = "true";	
	},
	view(this: Article, msg: Signal) {
		msg.subject = "";
		this.type.viewContent(this.model, this.view, 0);
	},
	selectAll(this: Article, event: UserEvent) {
		event.subject = "";
		let range = this.owner.selectionRange;
		range.selectNodeContents(this.element)
	}
});
