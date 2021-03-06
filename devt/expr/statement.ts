import {Value, EMPTY} from "../../api/model.js";
import {Receiver, Response} from "../../api/signal.js";

import {Scope, Property, Statement} from "../../base/compiler.js";
import {Impure, Pure} from "../../base/pure.js";
import {Origin} from "../../base/remote.js";
import {Interface} from "../../base/type.js";

import lex from "./lexer.js";
import parse from "./parser.js";

export class Source extends Statement {
	declare content: Source[];
	source: Element;

	getValue(): Value {
		return compileExpr(this);
	}
	load(source: Element) {
		this.source = source;
		this.content = source.children.length ? [] : EMPTY.array as any[];
		if (source.getAttribute("facets") == "use") {
			//Start loading the referenced resource.
			this.use(JSON.parse(source.getAttribute("value")));
		}
		for (let child of source.children) {
			if (child.nodeName == "note") {
				//for display only.
			} else {
				let stmt = createStatement(this, child);
				this.content.push(stmt);
				stmt.load(child);
			}
		}
	}
}

export class Module extends Source implements Receiver {
	constructor(origin: Origin) {
		super();
		this.#scope = new Scope();
		this,this.#origin = origin;
//		this.uses = Object.create(null);
	}
	#scope: Scope;
	#origin: Origin;
//	uses: Bundle<Module>;

	get scope(): Scope {
		return this.#scope;
	}

	getModule(path: string): Module {
		let response = this.#origin.responses[path];
		if (response) return response.req.from as Module;
	}
	getValue(): Value {
		importModule(this, this);
		return compileObject(this);
	}
	protected use(name: string): void {
		if (this.#origin.responses[name]) return;
		let module = new Module(this.#origin);
		this.#origin.open(name, module, "use");
	}
	receive(response: Response<string>): void {
		console.log("Module received: ", response);
		//if (response.statusCode == 200
		let source = new DOMParser().parseFromString(response.body, "text/xml").documentElement;
//		response["source"] = source;
		this.load(source);
//		console.log(this.#origin.responses);
	}
}
function importModule(into: Module, from: Module) {
	for (let stmt of from.content) {
		if (stmt instanceof Decl) {
			console.debug("IMPORT:", stmt.key, stmt);
			into.scope.members[stmt.key] = stmt;
			if (stmt.getFacet("use")) {
				let module = from.getModule(JSON.parse(stmt.source.getAttribute("value")));
				module.getValue();
				module && importModule(into, module);
			}
		}
	}

}
function createStatement(parent: Statement, child: Element): Source {
	if (child.getAttribute("key")) return new Decl(parent);
	if (child.getAttribute("keyword")) return new KeywordStatement(parent);
	return new Source(parent);
}

export class KeywordStatement extends Source {
	getValue(): Value {
		return compileExpr(this);
	}
}

const COMPILING = Object.freeze(Object.create(null));

export class Decl extends Source implements Property {
	load(source: Element) {
		this.key = source.getAttribute("key") || "";
		let facets = source.getAttribute("facets") || "";
		this.facets = facets ? facets.split(" ") : EMPTY.array as string[];
		super.load(source);
	}
	#value: Value;
	key: string;
	facets: string[];
	// get type(): Type {
	// 	return this.getValue().type;
	// }
	// get pure(): any {
	// 	let value = this.getValue();
	// 	return value == this ? undefined : value.pure;
	// }
	getFacet(facet: string) {
		for (let f of this.facets) {
			if (facet === f) return f;
		}
	}
	getValue(): Value {
		if (this.#value === undefined) {
			this.#value = COMPILING;
			this.#value = compile(this);
			if (this.#value === undefined) throw new Error();
		}
		return this.#value;
	}
}

type blockType = "object" | "array" | "fn" | "";
function blockType(stmt: Statement): blockType {
	let type: blockType = "";
	for (let content of stmt.content) {
		if (content instanceof KeywordStatement) {
			return "fn"
		} else if (content instanceof Decl) {
			if (!type) type = "object";
			if (type != "object") return "fn";
		} else {
			if (!type) type = "array";
			if (type != "array") return "fn";
		}
	}
	return type;
}

function compile(stmt: Source): Value {
	let expr = compileExpr(stmt);
	if (expr) {
		if (stmt.content.length) {
			return stmt.scope.notice("warn", "Both content & expression are not allowed.", expr);
		}
		return expr;
	}
	switch (blockType(stmt)) {
		case "":
		case "object":
			return compileObject(stmt);
		case "array":
			return compileArray(stmt);
		case "fn":
			return compileFunction(stmt);
	}
}

function compileExpr(stmt: Source): Value {
	let value = stmt.source.getAttribute("value") || "";
	if (!value) return;
	let compilable = parse(lex(value));
	return compilable.compile(stmt.scope);
}

function compileObject(source: Statement): Value {
	let object = Object.create(null);
	for (let stmt of source.content) {
		if (stmt instanceof Decl) {
			if (object[stmt.key]) {
				source.scope.notice("error", `Duplicate name "${stmt.key}"`, stmt as Value);
			} else {
				object[stmt.key] = stmt;
			}
		} else {
			source.scope.notice("error", "Not a declaration", stmt as Value);
		}
	}
	for (let name in object) {
		let stmt: Decl = object[name];
		if (stmt.getValue() == COMPILING) {
			source.scope.notice("error", `compilation cycle in "${stmt.key}"`, stmt as Value);
		}
	}

	if (source instanceof Decl && source.getFacet("type")) {
		return new Interface(source.key, object) as Value;
	}
	let type = source.scope.getType("object");
	let pure = Pure.object(object);
	return pure === undefined ? new Impure(type, object) : new Pure(type, pure);
	//return new Pure(source.scope.getType("object"), object);
}

function compileArray(stmt: Statement) {
	return new Pure(undefined, EMPTY.array);
}

function compileFunction(stmt: Statement) {
	return new Pure(undefined, EMPTY.function);
}
