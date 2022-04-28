
import {Value, Type, Bundle, EMPTY} from "../api/model.js";
import {level} from "../api/notice.js";

import {Pure} from "./pure.js";
import {NoticeValue} from "../../lang/compiler/target.js";

export interface Compilable {
	//TODO return Eval
	compile(scope: Scope, receiver?: Value): Value
}

export class Scope {
	constructor(scope?: Scope) {
		this.members = Object.create(scope ? scope.members : null);
	}
	members: Bundle<Statement>
	at(name: string): Value {
		if (Object.getOwnPropertyDescriptor(this.members, name)) return this.members[name].getValue();
		return new NoticeValue("error", `"${name}" is not in scope`, null);
	}
	// put(key: string, value: Value): void {
	// 	let member: any = this.members[key]
	// 	if (member?.facets?.reserved) {
	// 		value = this.notice("error", `"${key}" is a reserved name.`, value);
	// 	}
	// 	this.members[key] = value;
	// }
	getType(name: string): Type {
		let type = this.at(name);
		if (type instanceof Type) return type;
	}
	createPure(value: any): Pure {
		let type = this.getType(Pure.typeOf(value));
		return new Pure(type, value);
	}
	notice(level: level, message: string, value?: Value): Value {
		return new NoticeValue(level, message, value);
	}
}

export abstract class Statement  {
	constructor(source: Element, parent?: Statement) {
		this.source = source;
		this.parent = parent;
		this.content = source.children.length ? [] : EMPTY.array as any[];
	}
	readonly source: Element;
	readonly parent: Statement;
	readonly content: Statement[];
	
	get scope(): Scope {
		return this.parent?.scope || null;
	}
	abstract getValue(): Value;
}
