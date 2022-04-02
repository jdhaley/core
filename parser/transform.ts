import {Context, Transformer} from "../base/transform.js";
import {parser} from "./parse.js";

export const transformer: Transformer<Element, HTMLElement> = {
	transform: fromXML,
	target: toXML
}

function fromXML(xml: Element, context: Context<HTMLElement>): HTMLElement {
	if (!(context && context.container)) throw new Error("fromXML requires a context.container");
	if (!context.level) context.level = 0;
	//Do not create a view for the root xml element.
	if (context.level) {
		createItem(xml, context.container, context.level);	
	}
	context.level++;
	createChildren(xml, context);
	context.level--;
	return context.container;
}

function createItem(xml: Element, container: HTMLElement, level: number) {
	let view = container.ownerDocument.createElement("div");
	view.setAttribute("role", "row");
	view.setAttribute("aria-level", "" + (level || 0));
	container.append(view);
	let doc = view.ownerDocument.createElement("section");
	doc.innerHTML = "";
	if (xml.firstElementChild?.nodeName == "section") {
		doc.innerHTML = xml.firstElementChild.innerHTML || "<br>";
	}
	codeView(xml, view);
	view.append(doc);
}

function createChildren(xml: Element, context: Context<HTMLElement>) {
	for (let child of xml.children) {
		if (child.nodeName == "s") {
			fromXML(child, context);
		} else if (child.nodeName == "section") {
		} else {
			console.error("invalid child: ", child);
		}
	}
}

function codeView(xml: Element, view: HTMLElement) {
	let line: HTMLElement = view.ownerDocument.createElement("code");
	let code = parser.transform(xml.getAttribute("value") || "")
	line.innerHTML = code.innerHTML;
	view["model"] = code;
	view.append(line);
}

//////////////

function toXML(view: HTMLElement, context: Context<Element>): Element {
	let code = view["model"].textContent;
	let model = context.container.ownerDocument.createElement("s");
	model.setAttribute("value", code);
	if (view.firstElementChild.nodeName == "section") {
		model.innerHTML = view.firstElementChild.outerHTML;
	}
	//UNFINISHED!
	return model;
}



// function findParent(item: Element): Element {
// 	let level = items.getLevel(item);
// 	let role = items.getRole(item);
// 	for (let node = item.previousElementSibling; node; node = node.previousElementSibling) {
// 		if (items.getLevel(node) < level && items.getRole(node) != "heading") return node;
// 	}
// }

// function parse(view: HTMLElement) {
// 	let model = new EXPR();
// 	view["$S"] = model;
// 	for (let line of view.children) {
// 		if (line.nodeName == "P" && line.getAttribute("aria-role") != "heading") {
// 			let level = (line.getAttribute("aria-level") as any) * 1 || 0;
// 			let statement = new EXPR();
// 			statement.parse(line.textContent);
// 			line["$S"] = statement;
// 			let parent = findParent(line);
// 			if (!parent) parent = view;
// 			if (parent["$S"]) parent["$S"].children.push(statement);
// 		}
// 	}
// 	let doc = document.implementation.createDocument(null, "source");
// 	let xml = toXML(model, doc.documentElement);
// 	console.log(xml);
// 	view.innerHTML = "";
// 	fromXML(xml, view);
// }


/*
Source Model:
<s key=’key’ facets=’facets’ value=’value’>
	<section>
		Note text
	</section>
	0..n child <s> items…
	<s></s>
</s>

View Model:
<div role=”row” aria-level=”n” data-model=”source”>
	<span role=”cell” data-cell=”facets”>facets</span>
	<span role=”cell” data-cell=”key”>key:</span>
	<span role=”cell” data-cell=”value”>value</span>
	<div class=”errors”></div>
	<section>
		copied from model
	</section>
</div>
*/


// function createValueFields(source: EXPR, view: HTMLElement) {
// 	createField(source, "facets", view);
// 	createField(source, "key", view);
// 	createField(source, "expr", view);
// }

// function createExpression(context: HTMLElement, expr: Source): HTMLElement {
// //	if (expr instanceof SOURCE) expr = expr.expr;
// 	if (expr.nodeName == "expr" && expr.children.length == 1) expr = expr.children[0];
// 	let view = context.ownerDocument.createElement("span");
// 	context.append(view);
// 	view.dataset.model = expr.nodeName;
// 	if (expr instanceof Branch) {
// 		for (let child of expr.children) {
// 			view.append(createExpression(view, child))
// 		}
// 	} else {
// 		view.textContent = expr.textContent + " ";
// 	}
// 	return view;
// }

// function createField(source: EXPR, name: string, view: HTMLElement) {
// 	let field = view.ownerDocument.createElement("span");
// 	field.setAttribute("role", "cell");
// 	field.dataset.cell = name;
// 	field.textContent = source[name]?.textContent || "";
// 	if (name == "key" && field.textContent) field.textContent += ":";
// 	//if (!field.textContent) field.style.display = "none";
// 	view.append(field, " ");
// 	return field;
// }

// function findParent(item: Element): Element {
// 	let level = items.getLevel(item);
// 	let role = items.getRole(item);
// 	for (let node = item.previousElementSibling; node; node = node.previousElementSibling) {
// 		if (items.getLevel(node) < level && items.getRole(node) != "heading") return node;
// 	}
// }
