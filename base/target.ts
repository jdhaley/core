
import {Value} from "../api/model.js";
import {bundle, EMPTY} from "../api/util.js";
import {Notification, level} from "../api/util.js";
import {Context, Transform} from "../api/transform.js";

type Transforms = bundle<Transform<Eval, string>>

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

export class Notice implements Notification, Value, Eval {
	constructor(level: level, message: string, value?: Value) {
		console[level](message, value);
		this.#value = value || EMPTY.object;
		this.level = level;
		this.message = message;
	}
	#value: Value;
	level: level;
	message: string;

	get type() {
		return this.#value.type;
	}
	get pure() {
		return this.#value.pure;
	}
	get error(): string {
		if (this.level == "error") return this.message
	}

	evaluate(): Value {
		return this.#value;
	}
	transform(target: Target): string {
		return `/*${this.message}*/`
	}
}
