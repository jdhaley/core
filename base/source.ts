
import {Value, Content, Parcel} from "../api/model.js";

import {Eval, Target} from "./target.js";

export interface Source extends Eval, Content<Source> {
	parent: Source;

	// scope is compatible with Type to enable common interface for getting property values.
	scope: Parcel<string, Value>;

	load(source: any): void;
	evaluate(): Value;
	transform(target: Target): string;
	use(pathname: string): void;
}

