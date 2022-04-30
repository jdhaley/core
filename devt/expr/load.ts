// import {RemoteResponse} from "../../base/remote.js";
// import {Module, Loader} from "./statement.js";
// import { Frame } from "../../display/display.js";
// import { Receiver, Signal } from "../../../vm/ts/youni/base/control";

// class LoaderImpl extends Loader implements Receiver {
// 	files = {
// 	}
// 	receive(response: RemoteResponse) {
// 		let url = response.request.url;
// 		if (this.files[url])
// 		let module: Module;
// 		if (response.status == 404) {
// 			console.warn(`Note "${response.request.url}" not found.`);
// 			module = null;
// 		} else if (response.status == 200 {
// 			let doc = new DOMParser().parseFromString(response.response, "text/xml");
// 			module = new Module(this);
// 			module.load(doc.documentElement);	
// 		}
// 		this.files[url] = module;
// 		importFromModule(module);
// 		// this.f = processModel(this, msg.response);
	
// 		// let doc = new DOMParser().parseFromString(response.response, "text/xml");
// 		// //	let doc = note.view.ownerDocument.implementation.createDocument("source", "s");
// 		// //	doc.documentElement.innerHTML = this.model;
// 		// 	let model = doc.documentElement;
// 		// 	let module = new Module(model);
// 		// 	module.initialize();
// 	}
// 	importFromModule(module: Module) {

// 	}
// }



// // function processModel(note: Note, source: string) {
// // //	let doc = note.view.ownerDocument.implementation.createDocument("source", "s");
// // //	doc.documentElement.innerHTML = this.model;
// // 	module.initialize();
// // 	note["model"] = module;
// // 	note.send("draw");
// // 	note.send("view");
// // }

// opened(this: Note, msg: any) {
// 	this.dataset.file = msg.request.url;
// 	if (msg.status == 404) {
// 		console.warn(`Note "${msg.request.url}" not found.`);
// 		return;
// 	}
// 	this.model = processModel(this, msg.response);
// },

