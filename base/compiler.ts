
import {Bundle} from "../api/model.js";
import {Parcel, Type, Value} from "../api/value.js";
import {level} from "../api/notice.js";
import {Pure} from "./pure.js";
import {NoticeValue} from "./target.js";
import { Container } from "./container.js";

export interface Compilable {
	compile(scope: Scope, receiver?: Value): Value
}

export class Scope implements Container<string, Value> {
	constructor(scope?: Scope) {
		this.members = Object.create(scope ? scope.members : null);
	}
	members: Bundle<Value>
	get type() {
		return undefined;
	}
	at(name: string): Value {
		if (Object.getOwnPropertyDescriptor(this.members, name)) return this.members[name];
		return new NoticeValue("error", `"${name}" is not in scope`, null);
	}
	put(key: string, value: Value): void {
		let member: any = this.members[key]
		if (member?.facets?.reserved) {
			value = this.notice("error", `"${key}" is a reserved name.`, value);
		}
		this.members[key] = value;
	}
	getType(name: string): Type {
		let type = this.at(name);
		if (type?.pure instanceof Type) return type.pure;
	}
	createPure(value: any): Pure {
		let type = this.getType(Pure.typeOf(value));
		return new Pure(type, value);
	}
	notice(level: level, message: string, value?: Value): Value {
		return new NoticeValue(level, message, value);
	}
}
