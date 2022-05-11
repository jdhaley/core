import {Markup} from "../api/model.js";
import {Control} from "./control.js";

export class ControlElement extends Control implements Markup {
	protected get element(): Element {
		return null;
	}
	get name() {
		return this.element.nodeName;
	}
	get markup(): string {
		return this.element.outerHTML;
	}
	get markupContent(): string {
		return this.element.innerHTML;
	}
	set markupContent(content: string) {
		this.element.innerHTML = content;
	}
	get textContent(): string {
		return this.element.textContent;
	}
	set textContent(content: string) {
		this.element.textContent = content;
	}
	get partOf(): ControlElement {
		return this.element.parentNode["$control"];
	}
	get content(): Iterable<ControlElement> {
		const nodes = this.element.childNodes;
		let to = Object.create(null);
		to[Symbol.iterator] = function*() {
			for (let i = 0, len = nodes.length; i < len; i++) {
				let node = nodes[i];
				if (node["$control"]) yield node["$control"];
			}
		}
		Reflect.defineProperty(this, "content", {
			value: to
		});
		return to;
	}

	at(name: string): string {
		return this.element.getAttribute(name);
	}
	put(name: string, value: string) {
		this.element.setAttribute(name, value);
	}
	append(control: ControlElement) {
		this.element.append(control.element);
	}
}

export const text = {
	priorText(node: Node) {
		let parent = node.parentNode;
		for (node = node.previousSibling; node; node = node.previousSibling) {
			if (node.nodeType == Node.TEXT_NODE) return node;
			if (node.nodeType == Node.ELEMENT_NODE) {
				let text = this.lastText(node);
				if (text) return text;
			}
		}
		return parent ? this.priorText(parent) : null;
	},
	nextText(node: Node) {
		let parent = node.parentNode;
		for (node = node.nextSibling; node; node = node.nextSibling) {
			if (node.nodeType == node.TEXT_NODE) return node;
			if (node.nodeType == Node.ELEMENT_NODE) {
				let text = this.firstText(node);
				if (text) return text;
			}
		}
		return parent ? this.nextText(parent) : null;
	},
	firstText(node: Node) {
		for (node = node.firstChild; node; node = node.nextSibling) {
			if (node.nodeType == node.TEXT_NODE) return node;
			if (node.nodeType == Node.ELEMENT_NODE) {
				let text = this.firstText(node);
				if (text) return text;
			}
		}
	},
	lastText(node: Node) {
		for (node = node.lastChild; node; node = node.previousSibling) {
			if (node.nodeType == node.TEXT_NODE) return node;
			if (node.nodeType == Node.ELEMENT_NODE) {
				let text = this.lastText(node);
				if (text) return text;
			}
		}
	}
}

//monitor(this.element);
function monitor(article: Element) {
	// Options for the observer (which mutations to observe)
	const config = { subtree: true, characterData: true};

	// Callback function to execute when mutations are observed
	const callback = function(mutationsList, observer) {
		article["$changed"] = true;
		console.log(mutationsList);
		// // Use traditional 'for loops' for IE 11
		// for(const mutation of mutationsList) {
		// 	if (mutation.type === 'childList') {
		// 		console.log('A child node has been added or removed.');
		// 	}
		// 	else if (mutation.type === 'attributes') {
		// 		console.log('The ' + mutation.attributeName + ' attribute was modified.');
		// 	}
		// }
	};

	// Create an observer instance linked to the callback function
	const observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(article, config);
}

