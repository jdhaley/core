import {Controller} from "../api/signal.js";
import {bundle} from "../api/util.js";

import {Display} from "./display.js";

export interface FrameConf {
	controller: Controller;
	types: bundle<typeof Display>
}

export interface ViewConf {
	type?: string;
	nodeName?: string;
	styles?: string;
	shortcuts?: {
		[key: string]: string
	};
	controller: Controller;
	properties: {
		[key: string]: unknown;
	}
}

