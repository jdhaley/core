
import {Value, Parcel} from "../api/model.js";

import {Eval, Target} from "./target.js";

export abstract class Source implements Eval {
	constructor(parent?: Source) {
		this.parent = parent;
	}
	parent: Source;
	content: Source[];

	get scope(): Parcel<string, Value> {
		return this.parent?.scope || null;
	}

	abstract load(source: any): void;
	abstract evaluate(): Value;
	abstract transform(target: Target): string;

	protected use(pathname: string): void {
		if (this.parent) return this.parent.use(pathname);
		throw new Error("No parent for use()");
	}
}

