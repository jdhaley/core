import {bundle, EMPTY} from "../api/util.js";
import {Controller, Signal} from "../api/signal.js";
import {Commandable} from "../api/util.js";
import {Transformer} from "../api/transform.js";

import {Control} from "../base/control.js";
import {ControlElement, text} from "../base/dom.js";
import {RemoteFileService} from "../base/remote.js";
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
	sources: string,
	events: Controller;
	types: {
		[key: string]: typeof Display
	};
//	[key: string]: unknown;
}

export interface ViewConf {
	type?: string;
	nodeName?: string;
	styles?: string;
	shortcuts?: {
		[key: string]: string
	};
	actions: Controller;
	properties: {
		[key: string]: unknown;
	}
}

export class Owner extends Control {
	static of(node: Node | Range): Owner {
		if (node instanceof Range) node = node.commonAncestorContainer;
		return node?.ownerDocument["owner"];
	}
	constructor(origin: RemoteFileService) {
		super();
		this.origin = origin;
	}
	#lastId: number = 0;
	origin: RemoteFileService;

	get document(): Document {
		return null;
	}
	get part(): ControlElement {
		return this.document.documentElement["$control"];
	}
	get content() {
		let control = this.part;
		let decl = {
			value: {
				[Symbol.iterator]: function*() {
					yield control;
				}
			}
		}
		Reflect.defineProperty(this, "parts", decl);
		return decl.value;
	}
	get location() {
		return this.document.location;
	}

	createElement(name: string, namespace?: string): Element {
		if (namespace) {
			return this.document.createElementNS(namespace, name);
		} else {
			return this.document.createElement(name);
		}
	}
	createId() {
		return ++this.#lastId;
	}
	getId(ele: Element): string {
		if (ele.nodeType != Node.ELEMENT_NODE) ele = ele.parentElement;
		if (ele && !ele.id) {
			ele.id = "" + this.createId();
		}
		return ele ? ele.id : "";
	}
	controlOf(node: Node): ControlElement {
		while(node) {
			let control = node["$control"];
			if (control) return control;
			node = node.parentNode;
		}
	}
	createNodes(source: string | Range): Node[] {
		let list: NodeList;
		if (typeof source == "string") {
			let div = this.document.createElement("div");
			div.innerHTML = source;
			list = div.childNodes;
		} else if (source instanceof Range) {
			let frag = source.cloneContents();
			list = frag.childNodes;
		}
		let nodes = [];
		for (let node of list) {
			//Chrome adds a meta tag for UTF8 when the cliboard is just text.
			//TODO a more generalized transformation to be developed for all clipboard exchange.
			if (node.nodeName != "META") nodes.push(node);
		}
		return nodes;
	}
	markup(range: Range): string {
		let frag = range.cloneContents();
		let div = range.commonAncestorContainer.ownerDocument.createElement("div");
		while (frag.firstChild) {
			div.append(frag.firstChild);
		}
		return div.innerHTML;
	}
	append(control: ControlElement) {
		//cast to any to access the protected element.
		this.document.body.append((control as any).element);
	}
}


export class Frame extends Owner {
	#window: Window;
	types = {
	};
	model?: any;
	constructor(window: Window, conf: FrameConf) {
		super(new RemoteFileService(window.location.origin + conf.sources));
		this.#window = window;
		this.document["owner"] = this;
		if (conf.types) this.types = conf.types;
		for (let name in conf.events) {
			let listener = conf.events[name];
			this.#window.addEventListener(name, listener as any);
		}
		this.document.addEventListener("selectionchange", (event: UserEvent) => {
			let range = this.selectionRange;
			let view = this.controlOf(range.commonAncestorContainer);
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
	get part(): Display {
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
		return this.controlOf(target);
	}
}

export class Display extends ControlElement {
	constructor(owner: Frame, conf: ViewConf) {
		super();
		this.#element = owner.createElement(conf.nodeName || "div");
		this.#controller = conf.actions || EMPTY.object;
		this.#element["$control"] = this;
		if (conf.shortcuts) this.shortcuts = conf.shortcuts;
		if (conf.styles) this.#element.className = conf.styles;
	}
	#element: Element;
	#controller: Controller;
	shortcuts: bundle<string>;
	declare protected model: any;

	protected get element(): Element {
		return this.#element;
	}
	get controller(): Controller {
		return this.#controller;
	}
	get owner() {
		return Owner.of(this.element) as Frame;
	}
	get box() {
		return (this.element as HTMLElement).getBoundingClientRect();
	}
	get styles() {
		return (this.element as HTMLElement).classList;
	}
	get dataset() {
		return (this.element as HTMLElement).dataset;
	}
	setEditable(flag: boolean) {
		(this.element as HTMLElement).contentEditable = "" + flag;
	}
	getStyle(name?: string): CSSStyleDeclaration {
		let view = this.element as HTMLElement;
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
		this.transform = conf.properties.transform as Transformer<Node, HTMLElement>;
		this.commands = conf.properties.commands as Commandable<Range>;
	}
	protected commands: Commandable<Range>;
	protected transform: Transformer<Node, Element>
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