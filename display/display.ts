import {Signal} from "../api/signal.js";
import {Content, bundle, transform} from "../api/model.js";

import {DocumentControl, DocumentOwner, text, controlOf, ControlElement} from "../base/dom.js";
import {RemoteFileService} from "../base/remote.js";
import {FrameConf, ViewConf} from "./configuration.js";
import {CommandBuffer} from "../base/command.js";
import {extend} from "../base/util.js";
import { Control } from "../base/control.js";

export class Frame extends DocumentOwner {
	constructor(window: Window, conf: FrameConf) {
		super();
		this.#window = window;
		this.document["$owner"] = this;
		if (conf.types) this.types = conf.types;
		if (conf.views) this.controls = conf.views;
		for (let name in conf.controller) {
			let listener = conf.controller[name];
			let target = name == "selectionchange" ? this.document : this.#window;
			target.addEventListener(name, listener as any);
		}
	}
	#window: Window;
	types = Object.create(null)
	controls = Object.create(null);

	get document(): Document {
		return this.#window.document;
	}
	get activeElement() {
		return this.document.activeElement;
	}
	get selection(): Selection {
		return this.#window.getSelection();
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

	displayAt(x: number, y: number): Display {
		let target = this.document.elementFromPoint(x, y);
		return controlOf(target) as Display;
	}
}

export interface UserEvent extends Signal, UIEvent {
	target: Node;
	//all user events
	direction: "up";
	from: Control;
	source: Display;

	//selection change events.
	range: Range;

	//clipboard events
	clipboardData?: DataTransfer;

	//keyboard & mouse
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
	metaKey: boolean;

	//keyboard.
    shortcut: string;
    key: string;

	//mouse support - to be reviewed.
    track: Display;
    x?: number;
    y?: number;
	moveX?: number;
	moveY?: number;
}

export class Display extends DocumentControl {
	constructor(owner: Frame, conf: ViewConf) {
		super(owner, conf);
		let shortcuts = (this.partOf as Display)?.shortcuts;
		if (conf.shortcuts) {
			shortcuts = shortcuts ? extend(shortcuts, conf.shortcuts) : conf.shortcuts;
		}
		if (shortcuts) this.shortcuts = shortcuts;
		if (conf.styles) this.view.className = conf.styles;
	}
	declare protected shortcuts: bundle<string>;
	declare protected model: any;

	get owner() {
		return super.owner as Frame;
	}
	get content(): Iterable<Display> {
		return super.content as Iterable<Display>;
	}
	get article() {
		for (let part: ControlElement = this; part; part = part.partOf) {
			if (part instanceof Article) return part;
		}
	}
	get data() {
		return this.view.dataset;
	}
	get view(): HTMLElement {
		return this.element as HTMLElement;
	}
	get box() {
		return this.element.getBoundingClientRect();
	}
	get styles() {
		return this.element.classList;
	}

	getStyle(name?: string): CSSStyleDeclaration {
		return name ? this.element.classList[name] : this.view.style;
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
 * independent Articles opened.  Each Article has it's own CommandBuffer.
 */

export class Article extends Display {
	constructor(owner: Frame, conf: ViewConf) {
		super(owner, conf);
 		this.buffer = conf.properties.commands as CommandBuffer<Range>;
		this.transform = conf.properties.transform as transform<Content, Display>
		this.#service = new RemoteFileService(this.owner.location.origin + conf.properties.sources);
	}
	#service: RemoteFileService;
	readonly buffer: CommandBuffer<Range>;
	readonly transform: transform<Content, Display>;

	get service(): RemoteFileService {
		return this.#service;
	}

	getItemRange(startId: string, endId: string) {
		let range = this.owner.document.createRange();
		range.selectNodeContents(this.view);
		if (startId) {
			let start = this.owner.document.getElementById(startId);
			if (!start) throw new Error(`Start item.id '${startId}' not found.`);
			range.setStartAfter(start);
		}
		if (endId) {
			let end = this.owner.document.getElementById(endId);
			if (!end) throw new Error(`End item.id '${endId}' not found.`);
			range.setEndBefore(end);
		}
		return range;
	}
}
