
import {Value, Parcel, Bundle, Content} from "../api/model.js";
import { level } from "../api/notice.js";

import {Eval, Target} from "./target.js";

export type Compiler = Bundle<(source: Source) => Value>

export interface Scope {
	at(name: string): Value;
	notice(level: level, message: string, value?: Value): Value;
	compiler: Compiler;
}

export interface Source extends Eval, Content<Source> {
	scope: Scope;
	parent: Source;

	load(source: any): void;
	evaluate(): Value;
	transform(target: Target): string;
	use(pathname: string): void;
}

