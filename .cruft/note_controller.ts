// import {UserEvent} from "../../../core/display/display.js";
// import {extend} from "../../../core/base/util.js";
// import {markup, text} from "../../../core/base/dom.js";

// import {Note, items} from "../../items/items.js";

// import actions from "./items.js";

// const tag = {
// 	"b": "STRONG",
// 	"i": "EM",
// 	"u": "CITE",
// 	"q": "Q"
// }

// export default extend(actions, {
// 	cut(this: Note, event: UserEvent) {
// 		event.subject = "";
// 		let range = this.owner.selectionRange;
// 		if (range.collapsed) return;
// 		let source = this.owner.document.createElement("DIV");
// 		source.innerHTML = markup(range);
// 		let target = this.transform.target(source) as HTMLElement;

// 		this.commands.replace("Cut", range, "");
// 		event.clipboardData.setData("text/html", target.innerHTML);
// 		event.clipboardData.setData("text/plain", items.toTextLines(range));
// 	},
// 	copy(this: Note, event: UserEvent) {
// 		event.subject = "";
// 		let range = this.owner.selectionRange;
// 		let source = this.owner.document.createElement("DIV");
// 		source.innerHTML = markup(range);
// 		let target = this.transform.target(source) as HTMLElement;
// 		event.clipboardData.setData("text/html", target.innerHTML);
// 		event.clipboardData.setData("text/plain", items.toTextLines(range));
// 	},
// 	paste(this: Note, event: UserEvent) {
// 		event.subject = "";
// 		let range = this.owner.selectionRange;
// 		let data = event.clipboardData.getData("text/html");
// 		if (data) {
// 			let source = this.owner.document.createElement("DIV");
// 			source.innerHTML = data;
// 			data = this.transform.transform(source).innerHTML;
// 		} else {
// 			data = event.clipboardData.getData("text/plain");
// 			if (!data) return console.warn("no data to paste");	
// 			if (data.indexOf("\n")) {
// 				data = items.itemsFromText(this.owner.document, data).innerHTML;
// 			}
// 		}
// 		this.commands.replace("Paste", range, data);
// 		range.collapse();
// 	},
// 	charpress(this: Note, event: UserEvent) {
// 		event.subject = "";
// 		let range = this.owner.selectionRange;
// 		if (!range.collapsed) {
// 			/* TODO The range's start after the replace is from
// 				the start of the item (or text node) - not the actual selected range.
// 				This i think is a limitation of the replace algo.  There's not much harm here
// 				particularly when we collapse the range.
// 			*/
// 			this.commands.replace("Replace", range, `<P>${event.key}</P>`);
// 			range.collapse();
// 			return;
// 		}
// 		let node = range.commonAncestorContainer;
// 		if (node.nodeType != Node.TEXT_NODE) {
// 			let to = this.navigateToText(range, "next");
// 			if (!to) to = this.navigateToText(range, "prior");
// 			if (to) {
// 				range = to;
// 			} else {
// 				range.selectNodeContents(items.getItems(range));
// 				range.collapse(true);
// 				let value = event.key == " " ? "\xa0" : event.key;
// 				this.commands.replace("Insert", range, "<P>" + value + "</P>");
// 				to = range;
// 			}
// 		}

// 		let offset = range.startOffset;
// 		let text = range.commonAncestorContainer.textContent;
// 		text = text.substring(0, offset) + event.key + text.substring(offset);
// 		this.commands.edit("Enter-Text", range, text, offset + 1);
// 	},
// 	delete(this: Note, event: UserEvent) {
// 		event.subject = "";
// 		let range = this.owner.selectionRange;
// 		if (!range.collapsed) {
// 			this.commands.replace("Delete", range, "");
// 			return;
// 		} 
// 		let node = range.commonAncestorContainer;
// 		if (node.nodeType != Node.TEXT_NODE || range.startOffset >= node.textContent.length) {
// 			range = this.navigateToText(range, "next");
// 			if (!range) return console.warn("cant navigate to text node.");
// 		}
// 		if (items.getItem(range.commonAncestorContainer) != items.getItem(node)) {
// 			range.setStartAfter(items.getItem(node).lastChild);
// 			this.commands.replace("Join", range, "");
// 			return;
// 		}

// 		let offset = range.startOffset;
// 		let text = range.commonAncestorContainer.textContent;
// 		if (offset >= text.length) return;
// 		text = text.substring(0, offset) + text.substring(offset + 1);
// 		this.commands.edit("Delete-Text", range, text, offset);
// 	},
// 	erase(this: Note, event: UserEvent) {
// 		event.subject = "";
// 		let range = this.owner.selectionRange;
// 		if (!range.collapsed) {
// 			this.commands.replace("Delete", range, "");
// 			return;
// 		}
// 		let node = range.commonAncestorContainer;
// 		if (node.nodeType != Node.TEXT_NODE || range.startOffset == 0) {
// 			range = this.navigateToText(range, "prior");
// 			if (!range) return console.warn("cant navigate to text node.");
// 		}
// 		if (items.getItem(range.commonAncestorContainer) != items.getItem(node)) {
// 			range.setEndBefore(items.getItem(node).firstChild);
// 			this.commands.replace("Join", range, "");
// 			return;
// 		}
// 		let offset = range.startOffset;
// 		let text = range.commonAncestorContainer.textContent;
// 		if (offset < 1) return;
// 		text = text.substring(0, offset - 1) + text.substring(offset);
// 		this.commands.edit("Erase-Text", range, text, offset - 1);
// 	},
// 	enter(this: Note, event: UserEvent) {
// 		event.subject = "";
// 		let range = this.owner.selectionRange;
// 		if (!range.collapsed) return console.warn("TODO: split when selection is a range.");
// 		let point = {
// 			node: range.startContainer,
// 			offset: range.startOffset
// 		}
// 		let item = items.getItem(range);
// 		if (!item) return console.warn("Not on item for split");
// 		range.selectNodeContents(item);
// 		if (!markup(range)) {
// 			//TODO this warning probably won't ever appear due to having ws text in the item.
// 			return console.warn("Nothing to split - empty item.");
// 		}
// 		range.setEnd(point.node, point.offset);
// 		if (!markup(range)) {

// 			//For some reason, the selection range gets whacked.
// 			this.owner.selectionRange = this.commands.insert(range);
// 			return;
// 		}

// 		range.selectNodeContents(item);
// 		range.setStart(point.node, point.offset);
// 		this.commands.split(range);
// 		range.selectNodeContents(text.firstText(item.nextElementSibling));
// 		range.collapse(true);

// 	},
// 	tag(this: Note, event: UserEvent) {
// 		event.subject = "";
// 		let range = this.owner.selectionRange;
// 		let tagName = tag[event.key] || "SPAN";
// 		let content = markup(range) || "&nbsp;";
// 		this.commands.replace("Tag", range, `<p><${tagName}>${content}</${tagName}></p>`);
// 		let node = range.startContainer.childNodes[range.startOffset];
// 		range.selectNodeContents(node.firstChild);
// 		range.collapse();
// 	},
// });
