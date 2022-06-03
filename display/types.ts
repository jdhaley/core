

import {bundle, Type, Value} from "../api/model.js";

export type content = string | number | boolean | Iterable<content> | bundle<content>;

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

let LAST_ID = 1;
export class ContentType implements Type {
	name: string;
	types: bundle<ContentType>;
	toView(model: content, context: HTMLElement, level?: number): HTMLElement {
		let view = this.createView(context, level);
		view["$model"] = model;
		return view;
	}
	toModel(view: HTMLElement): content {
		return view.textContent == "\u200b" ? undefined : view.innerHTML;
	}
	viewToXml(view: HTMLElement, xml: Element): void {
		xml.innerHTML = view.textContent == "\u200b" ? "" : view.innerHTML;
	}
	xmlToView(xml: Element, view: HTMLElement, level?: number): HTMLElement {
		view = this.createView(view, level);
		view["$model"] = xml;
//		view.innerHTML = xml.innerHTML || "\u200b";
		return view;
	}
	generalizes(type: Type): boolean {
		return type instanceof ContentType;
	}
	for(value: Value): boolean {
		throw new Error("Method not implemented.");
	}
	loadChildren(view: HTMLElement, context: Element): HTMLElement {
		let level = view.getAttribute("aria-level") as any * 1 || 0;
		view = view.nextElementSibling as HTMLElement;
		while (view) {
			let nextLevel = view.getAttribute("aria-level") as any * 1 || 0;
			if (nextLevel > level) {
				let type = view["type$"];
				let model = type.viewToXml(view, context);
				context.append(model);
				context = model.ownerDocument.createElement("content$");
				model.append(context);
				view = this.loadChildren(view, context);
			}  else {
				return view;
			}
		}
		return view;
	}
	createView(context: HTMLElement, level: number): HTMLElement {
		let view = context.ownerDocument.createElement("div") as HTMLElement;
		view.id = "" + LAST_ID++;
		view["$type"] = this;
		if (this.name) view.dataset.type = this.name;
		if (level) view.setAttribute("aria-level", "" + level);
		return view;
	}
}

export class MarkupType extends ContentType {
	toView(model: content, context: HTMLElement, level?: number): HTMLElement {
		let view = super.toView(model, context, level);
		view.dataset.model = "markup";
		view.innerHTML = "" + (model || "\u200b");
		return view;
	}
}

export class TextType extends ContentType {
	toView(model: content, context: HTMLElement, level?: number): HTMLElement {
		let view = super.toView(model, context, level);
		view.dataset.model = "text";
		view.textContent = "" + (model || "\u200b");
		return view;
	}
	xmlToView(xml: Element, view: HTMLElement, level?: number): HTMLElement {
		view = super.xmlToView(xml, view, level);
		view.dataset.model = "text";
		view.textContent = xml.textContent || "\u200b";
		return view;
	}
	toModel(view: HTMLElement): content {
		return view.textContent == "\u200b" ? undefined : view.textContent;
	}
}

export class RecordType extends ContentType {
	xmlToView(xml: Element, view: HTMLElement, level?: number): HTMLElement {
		view = super.xmlToView(xml, view, level);
		view.dataset.model = "record";
		for (let name in this.types) {
			let value = xml.getElementsByTagName(name)[0];
			if (!value) value = xml.ownerDocument.createElement(name);
			let member = this.types[name].xmlToView(value, view);
			member.dataset.name = name;
			member.classList.add("member");
			view.append(member);
		}
		return view;
	}
	viewToXml(view: HTMLElement, xml: Element): void {
		for (let child of view.children) {
			//Don't generate child if there is no content.
			if (child instanceof HTMLElement && child.childNodes.length && child.textContent != "\u200b") {
				let propertyName = child.dataset.name;
				let type = this.types[propertyName];
				if (!type) throw new Error(`Property "${propertyName}" not found.`);
				let property = xml.ownerDocument.createElement(propertyName);
				xml.append(property);
				type.viewToXml(child, property);
			}	
		}
	}
	toView(model: bundle<content>, context: HTMLElement, level?: number): HTMLElement {
		let view = super.toView(model, context, level);
		view.dataset.model = "record";
		for (let name in this.types) {
			let value = model ? model[name] : null;
			//if (this.types[name] instanceof MarkupType) value = new Markup(value);
			let member = this.types[name].toView(value, view);
			member.dataset.name = name;
			member.classList.add("member");
			view.append(member);
		}
		return view;
	}
	toModel(view: HTMLElement): content {
		let model = Object.create(null);
		model.type$ = this.name;
		for (let child of view.children) {
			if (child instanceof HTMLElement) {
				let propertyName = child.dataset.name;
				let type = this.types[propertyName];
				if (!type) throw new Error(`Property "${propertyName}" not found.`);
				let value = type.toModel(child);
				if (value) model[propertyName] = value;
			}
		}
		return model;
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
	xmlToView(xml: Element, view: HTMLElement, level?: number): HTMLElement {
		view = super.xmlToView(xml, view, level);
		view.dataset.model = "list";
		this.viewXmlContent(xml, view, level);
		return view;
	}
	viewToXml(view: HTMLElement, xml: Element): void {
		for (let child of view.children) {
			if (child instanceof HTMLElement) {
				let typeName = child.dataset.type;
				if (!typeName) typeName = "text";
				let type = this.types[typeName];
				if (!type) throw new Error(`Type "${typeName}" not found.`);

				let ele = xml.ownerDocument.createElement(typeName);
				xml.append(ele);
				type.viewToXml(child, ele);
			}
		}
	}
	toView(model: Iterable<content>, context: HTMLElement, level?: number): HTMLElement {
		let view = super.toView(model, context, level);
		view.dataset.model = "list";
		this.viewContent(model, view, level);
		return view;
	}
	toModel(view: HTMLElement): content {
		let model = [];
		for (let child of view.children) {
			if (child instanceof HTMLElement) {
				let typeName = child.dataset.type;
				let type = this.types[typeName];
				if (!type) throw new Error(`Type "${typeName}" not found.`);
				model.push(type.toModel(child));
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
	viewXmlContent(model: Element, view: HTMLElement, level: number): void {
		for (let value of model.children) {
			let type = this.types[value.tagName] || this.defaultType;
			if (type.name == "tree") level++;
			let child = type.xmlToView(value, view)
			view.append(child);
		}
	}
	viewContent(model: Iterable<content>, view: HTMLElement, level: number): void {
		if (model && model[Symbol.iterator]) for (let value of model) {
			let type = this.types[typeOf(value)] || this.defaultType;
			if (type.name == "tree") level++;
			view.append(type.toView(value, view));
		} else {
			view.textContent = "\u200b";
		}
		let xml = document.implementation.createDocument(null, "list").documentElement;
		this.viewToXml(view, xml);
		console.log(xml);
		console.log(this.xmlToView(xml, view.ownerDocument.createElement("article")));
	}
}

export function typeOf(value: any): string {
	if (value && typeof value == "object") value = value.valueOf(value);
	switch (typeof value) {
		case "string":
			//using STX/ETX control codes...
			//if (value.substring(0, 1) == "\u0002") return "markup";
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


// function toModel(view: HTMLElement, context: Element): void {
// 	view = view.firstElementChild as HTMLElement;
// 	while (view) {
// 		let model = createModel(view, context);
// 		context.append(model);
// 		view = loadChildren(view, model);
// 	}
// }

// function loadChildren(view: HTMLElement, context: Element): HTMLElement {
// 	let level = view.getAttribute("aria-level") as any * 1 || 0;
// 	view = view.nextElementSibling as HTMLElement;
// 	while (view) {
// 		let nextLevel = view.getAttribute("aria-level") as any * 1 || 0;
// 		if (nextLevel > level) {
// 			let model = createModel(view, context);
// 			context.append(model);
// 			view = loadChildren(view, model);
// 		}  else {
// 			return view;
// 		}
// 	}
// 	return view;
// }

// function createModel(view: HTMLElement, context: Element): Element {
// 	let type = view["$type"] as ContentType;
// 	return type.viewToXml(view, context);
// }