import {Controller} from "../api/signal.js";
import {bundle} from "../api/model.js";

import {Display} from "./display.js";
import {ControlConf} from "../base/control.js";

export interface FrameConf {
	controller: Controller;
	types: bundle<typeof Display>;
	views: bundle<ViewConf>;
}

export interface ViewConf extends ControlConf {
	styles?: string;
	shortcuts?: {
		[key: string]: string
	};
}