import {Value} from "../api/value.js";
import {Notice, Notifier, Notifiable, level} from "../api/notice.js";

interface Transforms {
	[key: string]: (context: Target) => any;
}

export interface  Targeter extends Notifier {
	transform(context: Target): any
}

export class Target implements Notifiable {
	constructor(transforms: Transforms) {
		this.transforms = transforms;
	}
	transforms: Transforms;
	target(name: string, value: any): any {
		return this.transforms[name].call(value, this);
	}
	notify(notice: Notice): void {
		console[notice.level](notice);
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
