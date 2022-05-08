
import {Value, Content} from "../api/model.js";

import {Eval, Property, Target} from "./target.js";


export interface Scope {
	at(name: string): Value;
	put_temporary(name: string, value: Property): Value;
}

export interface Source extends Eval, Content<Source> {
	scope: Scope;
	parent: Source;

	load(source: any): void;
	evaluate(): Value;
	transform(target: Target): string;
	use(pathname: string): void;
}

