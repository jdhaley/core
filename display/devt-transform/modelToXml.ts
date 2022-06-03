import {content, ContentType, typeOf} from "../types.js";


export function toXml(model: content): Element {
	let doc = document.implementation.createDocument(null, typeOf(model));
	toXmlContent(model, doc.documentElement)
	return doc.documentElement;
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

export function viewToXml(view: HTMLElement, context: Element): void {
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
	// let model = context.ownerDocument.createElement()
	// let type = view["$type"] as ContentType;
	// return type.viewToXml(view, context);
	return null;
}