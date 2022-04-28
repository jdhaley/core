
import {Value, Bundle} from "../../api/model";
import {Notice, level} from "../../api/notice.js";
import {Context, Transform} from "../../api/transform";

type transform = Transform<Value, string>

export interface Eval extends Value {
	transform(this: Value, target: Target): string
}

export class Target implements Context<string> {
	constructor(transforms: Bundle<transform>) {
		this.transforms = transforms;
	}
	declare container: undefined;
	transforms: Bundle<transform>;
	target(name: string, value: Value): string {
		return this.transforms[name].call(value, this);
	}
}

export class NoticeValue implements Notice, Value {
	constructor(level: level, message: string, value?: Value) {
		console[level](message, value);
		this.value = value;
		this.level = level;
		this.message = message;
	}
	level: level
	message: string;
	value: Value
	get type() {
		return this.value?.type;
	}
	get pure() {
		return this.value?.pure;
	}
	get error(): string {
		if (this.level == "error") return this.message
	}
}
