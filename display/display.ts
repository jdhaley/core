import {Controller, Signal} from "../api/signal.js";
import {Transformer} from "../api/transform.js";
import {Commandable, bundle, EMPTY} from "../api/util.js";

import {ControlElement, DocumentOwner, text, controlOf} from "../base/dom.js";
import {RemoteFileService} from "../base/remote.js";
import { FrameConf, ViewConf } from "./configuration.js";

export class Frame extends DocumentOwner {
	constructor(window: Window, conf: FrameConf) {
		super();
		this.#window = window;
		this.document["owner"] = this;
		if (conf.types) this.#types = conf.types;
		for (let name in conf.controller) {
			let listener = conf.controller[name];
			this.#window.addEventListener(name, listener as any);
		}
		this.document.addEventListener("selectionchange", (event: UserEvent) => {
			let range = this.selectionRange;
			let view = controlOf(range.commonAncestorContainer);
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
	#window: Window;
	#types = Object.create(null);
	get document(): Document {
		return this.#window.document;
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
	get part(): Display {
		return this.document.body["$control"];
	}

	create(conf: ViewConf, parent?: Element): Display {
		let type = this.#types[conf.type] || Display;
		let display = new type(this, conf);
		if (parent) parent.append(display.element);
		return display;
	}
	displayAt(x: number, y: number): Display {
		let target = this.document.elementFromPoint(x, y);
		return controlOf(target) as Display;
	}
}

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


export class Display extends ControlElement {
	constructor(owner: Frame, conf: ViewConf) {
		super();
		this.#element = owner.createElement(conf.nodeName || "div") as HTMLElement;
		this.#controller = conf.controller || EMPTY.object;
		this.#element["$control"] = this;
		if (conf.shortcuts) this.shortcuts = conf.shortcuts;
		if (conf.styles) this.#element.className = conf.styles;
	}
	#element: HTMLElement;
	#controller: Controller;
	declare protected shortcuts: bundle<string>;
	declare protected model: any;

	protected get element(): HTMLElement {
		return this.#element;
	}
	get controller() {
		return this.#controller;
	}
	get owner() {
		return DocumentOwner.of(this.element) as Frame;
	}
	get box() {
		return this.element.getBoundingClientRect();
	}
	get styles() {
		return this.element.classList;
	}
	get dataset() {
		return this.element.dataset;
	}
	setEditable(flag: boolean) {
		this.element.contentEditable = "" + flag;
	}
	getStyle(name?: string): CSSStyleDeclaration {
		return name ? this.element.classList[name] : this.element.style;
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
		this.transform = conf.properties.transform as Transformer<Node, HTMLElement>;
		this.commands = conf.properties.commands as Commandable<Range>;
		this.#service = new RemoteFileService(this.owner.location.origin + conf.properties.sources);
	}
	#service: RemoteFileService;
	protected commands: Commandable<Range>;
	protected transform: Transformer<Node, Element>

	get service(): RemoteFileService {
		return this.#service;
	}
	
	navigateToText(range: Range, direction: "prior" | "next"): Range {
		let node = range.commonAncestorContainer;
		if (node == this.element) {
			node = this.element.childNodes[range.startOffset];
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