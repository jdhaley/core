export {Node, Element, Document, Range}

interface Iterator<T> {
	next(): {
		value: T;
		done: boolean;
	}
}

interface List<T> {
	[Symbol.iterator](): Iterator<Node>;
	length: number;
	[key: number]: Node;
}

interface Node {
	nodeType: number;
	nodeName: string;
	previousSibling: Node;
	nextSibling: Node;
	parentNode: Node;
	ownerDocument: Node;
	childNodes: List<Node>;
	textContent: string;
}

interface Element extends Node {
	firstChild: Node;
	lastChild: Node;
	id: string;
	className: string;
	innerHTML: string;
	getAttribute(name: string): string;
	setAttribute(name: string, value: string): void;
	removeAttribute(name: string): void;
	append(value: string | Node): void;
}

interface Document {
	//createElementNS(namespace, name);
	createElement(name: string): Element;
	createTextNode(): Node;
}

interface AbstractRange {
	/** Returns true when the start point and end point are the same. */
	readonly collapsed: boolean;
    /** Returns the node, furthest away from the document, that is an ancestor of both range's start node and end node. */
    readonly commonAncestorContainer: Node;
	/** Returns range's start node. */
	readonly startContainer: Node;
	/** Returns range's start offset. */
	readonly startOffset: number;	
    /** Returns range's end node. */
    readonly endContainer: Node;
    /** Returns range's end offset. */
    readonly endOffset: number;
}
interface RangeSelection {
	collapse(toStart?: boolean): void;
	selectNode(node: Node): void;
    selectNodeContents(node: Node): void;
    setEnd(node: Node, offset: number): void;
    setEndAfter(node: Node): void;
    setEndBefore(node: Node): void;
    setStart(node: Node, offset: number): void;
    setStartAfter(node: Node): void;
    setStartBefore(node: Node): void;
}
interface RangeComparison {
	/** Point is a range-point */
	isPointInRange(node: Node, offset: number): boolean;
    /** Returns whether range intersects node. */
	compareBoundaryPoints(how: number, sourceRange: Range): number;
    /** Returns −1 if the point is before the range, 0 if the point is in the range, and 1 if the point is after the range. */
    comparePoint(node: Node, offset: number): number;
    getBoundingClientRect(): DOMRect;
    getClientRects(): DOMRectList;
    intersectsNode(node: Node): boolean;
}
interface RangeContentMutation {
    detach(): void;
 	deleteContents(): void;
	extractContents(): DocumentFragment;
	surroundContents(newParent: Node): void;
	insertNode(node: Node): void;
}
interface RangeContentGeneration {
	cloneRange(): Range;
	cloneContents(): DocumentFragment;
	createContextualFragment(fragment: string): DocumentFragment;
}

/** A fragment of a document that can contain nodes and parts of text nodes. */
interface Range extends AbstractRange, RangeSelection, RangeComparison, RangeContentMutation {
}
// readonly END_TO_END: number;
// readonly END_TO_START: number;
// readonly START_TO_END: number;
// readonly START_TO_START: number;