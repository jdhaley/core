
import {Value, Bundle} from "../api/model";
import {Notice, level} from "../api/notice.js";
import {Context, Transform} from "../api/transform";

type Transforms = Bundle<Transform<Eval, string>>

export interface Eval {
	evaluate(): Value;
	transform(target: Target): string
}

export interface Property extends Eval {
	readonly key: string;
	readonly facets: string[];
}

export class Target implements Context<string> {
	constructor(transforms: Transforms) {
		this.transforms = transforms;
	}
	declare container: undefined;
	transforms: Transforms;
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
