
import {Bundle} from "../api/model.js";
import {Parcel, Type, Value} from "../api/value.js";
import {level} from "../api/notice.js";
import {Pure, typeOf} from "./pure.js";
import {NoticeValue} from "./target.js";

export interface Compilable {
	compile(scope: Scope, receiver?: Value): Value
}

export abstract class Receivable implements Compilable {
	abstract compile(scope: Scope, receiver: Value): Value
}

export class Scope extends Parcel<string, Value> {
	protected get scope(): Bundle<Value> {
		return null;
	}
	at(name: string): Value {
		if (Object.getOwnPropertyDescriptor(this.scope, name)) return this.scope[name];
		return new NoticeValue("error", `"${name}" is not in scope`, null);
	}
	put(key: string, value: Value): void {
		let member: any = this.scope[key]
		if (member?.facets?.reserved) {
			value = this.notice("error", `"${key}" is a reserved name.`, value);
		}
		this.scope[key] = value;
	}
	getType(name: string): Type {
		let type = this.at(name);
		if (type?.pure instanceof Type) return type.pure;
	}
	createPure(value: any): Pure {
		let type = this.getType(typeOf(value));
		return new Pure(type, value);
	}
	notice(level: level, message: string, value: Value): Value {
		return new NoticeValue(level, message, value);
	}
}
