export interface Bundle<T> {
	[key: string]: T;
}

export interface Array<T> extends Iterable<T> {
	length: number;
	[key: number]: T;
}

export type constant = string | number | boolean | null

export type serial = constant | Bundle<serial> | Array<serial>;


/** Markup provides a view into "markup" which is a simple subset of SGML (HTML & XML) markup.
 	Well-formed markup should be parseable through either an HTML or XML parser, therefore this view
	always produces markup with an end tag.
	- no shortcut tag closing through "<tag/>" (to support HTML)
	- start tags always have a matching end tag (to support XML)
	- when constructing Markup from XML, tags are always converted to lowercase.

	DIFFERENCE WITH DOM: Markup text nodes can have a tag name like an element.  You can have textContent
	AND a non "#text" name with an empty Sequence<Markup>.

	Markup allows for various graphs such as a rooted tree, DAG, and cyclic graphs.
*/
export interface Markup {
	/** A valid name follows the grammar rule: '#'? [a-z] ([a-z] | [0-9] | '$' | '_')*
		This promotes Markup names & typeNames to map directly to property names.
	 */
	readonly name: string;					//DOM.Node.nodeName
	readonly attributes: Bundle<string>
	readonly content: Iterable<Markup>
	readonly markup: string;				//DOM.Node.outerHTML
	readonly markupContent: string;			//DOM.Node.innerHTML
	readonly textContent: string;			//DOM.Node.textContent
}

export type content = string | Markup;
