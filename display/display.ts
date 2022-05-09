import {Bundle} from "../api/model.js";
import {Controller, Signal} from "../api/signal.js";
import {Commandable} from "../api/util.js";
import {Transformer} from "../api/transform.js";
import {Viewer, Owner, text} from "./dom.js";

import {Origin} from "../base/remote.js";
//import {Node, Element, Range} from "./domParts.js";

export interface UserEvent extends Signal, UIEvent {
	sensor: Display;
	//keyboard & mouse
    ctrlKey: boolean,
    altKey: boolean,
    shiftKey: boolean,
	metaKey: boolean,
	//clipboard events
	clipboardData?: DataTransfer,
	//keyboard.
    shortcut: string;
    key: string,
	//mouse support - to be reviewed.
    track: Display;
    x?: number;
    y?: number;
	moveX?: number;
	moveY?: number;
}

export interface FrameConf {
	origin: Origin,
	events: Controller;
	actions: Controller;
	types: {
		[key: string]: typeof Display
	};
	[key: string]: unknown;
}

export interface ViewConf {
	type?: string;
	nodeName?: string;
	styles?: string;
	shortcuts?: {
		[key: string]: string
	};
	actions: Controller;
	[key: string]: unknown;
}

export class Frame extends Owner {
	#window: Window;
	types = {
	};
	model?: any;
	constructor(window: Window, conf: FrameConf) {
		super(conf.origin, conf.actions);
		this.#window = window;
		this.document["owner"] = this;
		if (conf.types) this.types = conf.types;
		for (let name in conf.events) {
			let listener = conf.events[name];
			this.#window.addEventListener(name, listener as any);
		}
		this.document.addEventListener("selectionchange", (event: UserEvent) => {
			let range = this.selectionRange;
			let view = this.viewerOf(range.commonAncestorContainer);
			if (view) {
				event.subject = "selectionchange";
				event["range"] = range;
				//TODO may make more sense to sense but we would need to change the sense
				//sending to the view itself.
				//view.sense(event);
				view.send(event);
			}
		});
	}
	create(conf: ViewConf): Display {
		let type = this.types[conf.type] || Display;
		return new type(this, conf);
	}
	get document(): Document {
		return this.#window.document;
	}
	get part(): Viewer {
		return this.document.body["$control"];
	}
	get activeElement() {
		return this.document.activeElement;
	}
	get selectionRange() {
		let selection = this.#window.getSelection();
		let range: Range;
		if (selection && selection.rangeCount) {
			range = selection.getRangeAt(0);
		} else {
			range = this.document.createRange();
		}
		range["owner"] = this;
		return range;
	}
	set selectionRange(range: Range) {
		let selection = this.#window.getSelection();
		if (selection && selection.rangeCount) {
			selection.removeAllRanges();
		}
		selection.addRange(range);
	}
	viewAt(x: number, y: number) {
		let target = this.document.elementFromPoint(x, y);
		return this.viewerOf(target);
	}
}

export class Display extends Viewer {
	constructor(owner: Frame, conf: ViewConf) {
		super(owner, conf);
		if (conf.shortcuts) this.shortcuts = conf.shortcuts;
		if (conf.styles) this.view.className = conf.styles;
	}
	shortcuts: Bundle<string>;
	get owner(): Frame {
		return super.owner as Frame;
	}
	get box() {
		return (this.view as HTMLElement).getBoundingClientRect();
	}
	get styles() {
		return (this.view as HTMLElement).classList;
	}
	get dataset() {
		return (this.view as HTMLElement).dataset;
	}
	setEditable(flag: boolean) {
		(this.view as HTMLElement).contentEditable = "" + flag;
	}
	getStyle(name?: string): CSSStyleDeclaration {
		let view = this.view as HTMLElement;
		return name ? view.classList[name] : view.style;
	}
	size(width: number, height: number) {
		let style = this.getStyle();
		style.width = Math.max(width, 16) + "px";
		style.minWidth = style.width;
		style.height = Math.max(height, 16) + "px";
		style.minHeight = style.height;
	}
	position(x: number, y: number) {
		let style = this.getStyle();
		style.position = "absolute";			
		style.left = x + "px";
		style.top = y + "px";
	}
}

/**
 * An Article is a display for a whole entity/resource. A single Frame may have multiple
 * independent Articles opened.
 */
export class Article extends Display {
	constructor(owner: Frame, conf: ViewConf) {
		super(owner, conf);
		this.transform = conf.transform as Transformer<Node, HTMLElement>;
		this.commands = conf.commands as Commandable<Range>;
	}
	protected commands: Commandable<Range>;
	protected transform: Transformer<Node, Element>
	navigateToText(range: Range, direction: "prior" | "next"): Range {
		let node = range.commonAncestorContainer;
		if (node == this.view) {
			node = this.view.childNodes[range.startOffset];
			if (!node) return null;
			node = direction == "prior" ? text.lastText(node) : text.firstText(node);
		} else {
			node = direction == "prior" ? text.priorText(node) : text.nextText(node);
		}
		if (node?.nodeType == Node.TEXT_NODE) {
			range.selectNodeContents(node);
			range.collapse(direction == "prior" ? false : true);
			return range;
		}
		return null;	
	}
}