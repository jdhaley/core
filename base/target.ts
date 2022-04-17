import {Notice, Notifier, Notifiable} from "../api/notice";

interface Transforms {
	[key: string]: (context: Target) => any;
}

export abstract class Targeter extends Notifier {
	abstract transform(context: Target): any
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