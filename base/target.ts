
import {Content, Parcel, Value} from "../api/model.js";
import {bundle, EMPTY, Notification, level} from "../api/util.js";
import {Context, Transform} from "../api/transform.js";

export interface Eval {
	evaluate(): Value;
	transform(target: Target): string
}

export interface Property extends Eval {
	readonly key: string;
	readonly facets: string[];
}

export interface Source extends Eval, Content<Source> {
	// scope is compatible with Type to enable common interface for getting property values.
	scope: Parcel<Value>;

	load(source: any): void;
	evaluate(): Value;
	transform(target: Target): string;
	use(pathname: string): void;
}

type Transforms = bundle<Transform<Eval, string>>

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
