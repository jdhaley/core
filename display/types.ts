

import {bundle, Type, Value} from "../api/model.js";

export type content = string | number | boolean | Iterable<content> | object;

let LAST_ID = 1;

class Markup {
	constructor(markup: string) {
		this.#markup = markup;
	}
	#markup: string;
	valueOf() {
		return this.#markup;
	}
}

/*
The context is "this" argument. You would either call the transforms with the desired
context or Function.bind them to the context.
*/
type transform<From, To> = (this: any, from: From) => To;

export class ContentType implements Type {
	name: string;
	types: bundle<ContentType>;
	toView(model: content, context: HTMLElement, level?: number): HTMLElement {
		let view = context.ownerDocument.createElement("div") as HTMLElement;
		view.id = "" + LAST_ID++;
		view["$type"] = this;
		view["$model"] = model;
		if (this.name) view.dataset.type = this.name;
		if (level) view.setAttribute("aria-level", "" + level);
		return view;
	}
	toModel(view: HTMLElement, context: any): content {
		return undefined;
	}
	jsonToXml(model: content): Element {
		let doc = document.implementation.createDocument(null, typeOf(model));
		toXmlContent(model, doc.documentElement)
		return doc.documentElement;
	}
	viewToXml(view: HTMLElement, model: Element): Element {
		return null;
	}
	generalizes(type: Type): boolean {
		return type instanceof ContentType;
	}
	for(value: Value): boolean {
		throw new Error("Method not implemented.");
	}
}

export class MarkupType extends ContentType {
	toView(model: content, context: HTMLElement, level?: number): HTMLElement {
		let view = super.toView(model, context, level);
		view.dataset.model = "markup";
		view.innerHTML = "" + (model || "\u200b");
		return view;
	}
	toModel(view: HTMLElement, context: any): content {
		return view.textContent == "\u200b" ? undefined : view.innerHTML;
	}
}
export class TextType extends ContentType {
	toView(model: content, context: HTMLElement, level?: number): HTMLElement {
		let view = super.toView(model, context, level);
		view.dataset.model = "text";
		view.textContent = "" + (model || "\u200b");
		return view;
	}
	viewToXml(view: HTMLElement, context: Element) {
		context.innerHTML = view.innerHTML;
		return context;
	}
	toModel(view: HTMLElement, context: any): content {
		return view.textContent == "\u200b" ? undefined : view.textContent;
	}
}

export class RecordType extends ContentType {
	keys() {
		return Object.keys(this.types);
	}
	toView(model: object, context: HTMLElement, level?: number): HTMLElement {
		let view = super.toView(model, context, level);
		view.dataset.model = "record";
		for (let name in this.types) {
			let value = model ? model[name] : null;
			if (this.types[name] instanceof MarkupType) value = new Markup(value);
			let member = this.types[name].toView(value, view);
			member.dataset.name = name;
			member.classList.add("member");
			view.append(member);
		}
		return view;
	}
	toModel(view: HTMLElement, context: any): content {
		let model = Object.create(null);
		model.type$ = this.name;
		for (let child of view.children) {
			if (child instanceof HTMLElement) {
				let propertyName = child.dataset.name;
				let type = this.types[propertyName];
				if (!type) debugger;
				let value = type.toModel(child, this);
				if (value) model[propertyName] = value;
			}
		}
		return model;
	}
	viewToXml(view: HTMLElement, context: Element) {
		context.innerHTML = view.innerHTML;
		return null;
	}
	generalizes(type: Type): boolean {
		if (type instanceof RecordType) {
			for (let name in this.types) {
				if (!this.types[name].generalizes(type.types[name])) return false;
			}
			return true;
		}
		return false;
	}
}

export class CollectionType extends ContentType {
	defaultType: ContentType;
	toView(model: Iterable<content>, context: HTMLElement, level?: number): HTMLElement {
		let view = super.toView(model, context, level);
		view.dataset.model = "list";
		this.viewContent(model, view, level);
		return view;
	}
	toModel(view: HTMLElement, context: any): content {
		let model = [];
		for (let child of view.children) {
			if (child instanceof HTMLElement) {
				let typeName = child.dataset.type;
				let type = this.types[typeName];
				if (!type) debugger;
				model.push(type.toModel(child, this));
			}
		}
		return model.length ? model : undefined;
	}
	generalizes(type: Type): boolean {
		if (type instanceof CollectionType) {
			for (let name in type.types) {
				if (!this.types[name].generalizes(type.types[name])) return false;
			}
			return true;
		}
		return false;
	}
	viewContent(model: Iterable<content>, view: HTMLElement, level: number): void {
		console.log(this.jsonToXml(model))
		if (model && model[Symbol.iterator]) for (let value of model) {
			let type = this.types[typeOf(value)] || this.defaultType;
			if (type.name == "tree") level++;
			view.append(type.toView(value, view));
		} else {
			view.textContent = "\u200b";
		}
	}
}

function typeOf(value: any): string {
	if (value && typeof value == "object") value = value.valueOf(value);
	switch (typeof value) {
		case "string":
		case "number":
		case "boolean":
			return "text";
		case "object":
			if (value instanceof Markup) return "markup";
			if (value["type$"]) return value["type$"];
			if (value[Symbol.iterator]) return "list";
			return "record";
		default:
			return "null";
	}
}

let BASE_TYPES: bundle<typeof ContentType> = {
	text: TextType,
	markup: MarkupType,
	list: CollectionType,
	tree: CollectionType,
	record: RecordType
}

export function loadTypes(conf: bundle<any>): CollectionType {
	let types = Object.create(null);
	for (let name in BASE_TYPES) {
		types[name] = new BASE_TYPES[name]();
	}
	for (let name in conf) {
		getType(name, types, conf);
	}
	let type = new CollectionType();
	type.types = types;
	return type;
}

function getType(name: string, types: bundle<ContentType>, conf: bundle<string | object>) {
	let type = types[name];
	if (!type && conf[name]) {
		let value = conf[name];
		if (typeof value == "object") {
			type = createType(name, value, types, conf);
		} else {
			type = getType(value, types, conf);
		}
	} else if (!type) {
		type = new TextType();
		console.error(`Type "${name}" is not defined.`);
	}
	types[name] = type;
	return type;
}

function createType(name: string, value: bundle<any>, types: bundle<ContentType>, conf: bundle<string | object>) {
	let supertype = value["type$"] ? getType(value["type$"] as string, types, conf) : null;
	let type = Object.create(supertype);
	if (name) {
		type.name = name;
		types[name] = type;
	}
	type.types = Object.create(supertype.types || null);
	for (let name in value) {
		if (name != "type$") {
			let member = value[name];
			if (typeof member == "object") {
				member = createType("", member, types, conf);
				member.name = name;
			} else {
				member = getType(value[name], types, conf);
			}
			type.types[name] = member;
		}
	}
	return type;
}

function toXmlContent(model: content, element: Element) {
	let type = typeOf(model);
	switch (type) {
		case "null":
			break;
		case "text":
			if (typeof model != "string") element.setAttribute("type", typeof model);
			element.textContent = "" + model;
			break;
		case "list":
			for (let value of model as Iterable<content>) {
				let ele = element.ownerDocument.createElement(typeOf(value));
				element.append(ele);
				toXmlContent(value, ele);
			}
			break;
		default:
			if (type != element.nodeName) element.setAttribute("type", type);
			for (let name in model as object) {
				if (name == "type$") continue;
				let prop = element.ownerDocument.createElement(name);
				element.append(prop);
				toXmlContent(model[name], prop);
			}
			break;
	}
}

function toView(model: content, element: Element) {
	let type = typeOf(model);
	switch (type) {
		case "null":
			break;
		case "text":
			element.setAttribute("data-type", typeof model);
			element.textContent = "" + model;
			break;
		case "list":
			for (let value of model as Iterable<content>) {
				let ele = element.ownerDocument.createElement(typeOf(value));
				element.append(ele);
				toXmlContent(value, ele);
			}
			break;
		default:
			if (type != element.nodeName) element.setAttribute("data-type", type);
			for (let name in model as object) {
				if (name == "type$") continue;
				let prop = element.ownerDocument.createElement(name);
				element.append(prop);
				toXmlContent(model[name], prop);
			}
			break;
	}
}

function toModel(view: HTMLElement, context: Element): void {
	view = view.firstElementChild as HTMLElement;
	while (view) {
		let model = createModel(view, context);
		context.append(model);
		view = loadChildren(view, model);
	}
}

function loadChildren(view: HTMLElement, context: Element): HTMLElement {
	let level = view.getAttribute("aria-level") as any * 1 || 0;
	view = view.nextElementSibling as HTMLElement;
	while (view) {
		let nextLevel = view.getAttribute("aria-level") as any * 1 || 0;
		if (nextLevel > level) {
			let model = createModel(view, context);
			context.append(model);
			view = loadChildren(view, model);
		}  else {
			return view;
		}
	}
	return view;
}

function createModel(view: HTMLElement, context: Element): Element {
	let type = view["$type"] as ContentType;
	return type.viewToXml(view, context);
}