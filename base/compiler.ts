
import {Value, Type, Bundle} from "../api/model.js";
import {level} from "../api/notice.js";
import {NoticeValue} from "./target.js";

import {Pure} from "./pure.js";

export interface Property {
	readonly key: string;
	readonly facets: string[];
	getValue(): Value;
}

export interface Compilable {
	//TODO return Eval
	compile(scope: Scope, receiver?: Value): Value
}

export class Scope {
	constructor(scope?: Scope) {
		this.members = Object.create(scope ? scope.members : null);
	}
	members: Bundle<Property>
	at(name: string): Value {
		if (this.members[name]) return this.members[name].getValue();
		return this.notice("error", `"${name}" is not in scope`, null);
	}
	// put(key: string, value: Value): void {
	// 	let member: any = this.members[key]
	// 	if (member?.facets?.reserved) {
	// 		value = this.notice("error", `"${key}" is a reserved name.`, value);
	// 	}
	// 	this.members[key] = value;
	// }
	getType(name: string): Type {
		let value = this.at(name);
		if (value.pure instanceof Type) return value.pure;
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
	constructor(parent?: Statement) {
		this.parent = parent;
	}
	readonly parent: Statement;
	content: Statement[];
	
	get scope(): Scope {
		return this.parent?.scope || null;
	}

	abstract getValue(): Value;
	protected use(name: string): void {
		if (this.parent) return this.parent.use(name);
		throw new Error("No parent for use()");
	}
}
