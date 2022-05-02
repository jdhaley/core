import {Bundle, serial} from "../api/model.js";
import {Receiver, Transmitter, Request, Response} from "../api/signal.js";
import {Message} from "./control.js";

class Remote implements Transmitter, Receiver {
	send(request: Request) {
		let xhr = this.prepare(request);
		let body = request.body;
		let content = typeof body != "string" ? JSON.stringify(body) : body;
		xhr.send(content);
	}
	receive(message: Response): void {
		let to = message.request.sender;
		if (typeof to == "function") {
			to(message);
		} else {
			to.receive(message);
		}
	}
	protected prepare(request: Request): XMLHttpRequest {
		let xhr = this.createRemoteRequest(request);
		xhr.open(request.method || "HEAD", this.getEndpoint(request));
		request.headers && this.setHeaders(xhr, request.headers);
		return xhr;
	}
	protected setHeaders(xhr: any, headers: any) {
		for (let name in headers) {
			let value = headers[name];
			value && xhr.setRequestHeader(name, value);
		}
	}
	protected getEndpoint(request: Request) {
		return request.url;
	}
	protected monitor(xhr: any) {
		switch (xhr.readyState) {
			case 0: // UNSENT Client has been created. open() not called yet.
			case 1: // OPENED open() has been called.
			case 2: // HEADERS_RECEIVED send() has been called, and headers and status are available.
			case 3:	// LOADING Downloading; responseText holds partial data.
				break;
			case 4: // DONE The operation is complete.
				let response = this.createResponse(xhr);
				this.receive(response);
			}
	}
	protected createRemoteRequest(request: Request): XMLHttpRequest {
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => this.monitor(xhr);
		xhr["request"] = request;
		return xhr;
	}
	protected createResponse(xhr: any): Response {
		let msg = new Message(xhr.request.subject, "down") as Response;
		msg.request = xhr.request,
		msg.response = xhr.responseText,
		msg.status = xhr.status;
		return msg;
	}
}


export interface Loadable {
	source?: any;
	load(source: any): void;
}

class DEFAULT_LOADABLE implements Loadable {
	source = undefined;
	load(source: any) {
		if (source === undefined) source = null;
		this.source = source;
	}
}
export class Origin extends Remote {
	constructor(origin?: string) {
		super();
		this.origin = origin || "";
		this.resources = Object.create(null);
	}
	origin: string
	resources: Bundle<Loadable>;

	open(to: Receiver | Function, path: string, subject?: string) {
		this.send({
			direction: "down",
			subject: subject || "opened",
			sender: to,
			url: path,
			method: "GET"
		});
	}
	save(to: Receiver | Function, path: string, body: serial, subject?: string) {
		this.send({
			direction: "down",
			subject: subject || "saved",
			sender: to,
			url: path,
			method: "PUT",
			body: body
		});
	}
	protected getEndpoint(request: Request) {
		return this.origin + request.url;
	}
	use(path: string, target?: Receiver | Function): void {
		if (this.resources[path]) return;
		let resource = this.createResource();
		this.resources[path] = resource;
		// let request: Request = {
		// 	direction: "down",
		// 	subject: "load",
		// 	to: target,
		// 	url: path,
		// 	method: "GET",
		// }
		this.open(this, path, "load");
	}
	receive(response: Response): void {
		if (response.subject != "load") return super.receive(response);
		let resource = this.resources[response.request.url];
		if (!resource || resource.source !== undefined) throw new Error("Error loading content.");
		if (response.status == 200) {
			let doc = new DOMParser().parseFromString(response.response, "text/xml");
			resource.load(doc.documentElement);
		} else {
			resource.source = null;
			console.error(`Note "${response.request.url}" not found.`);
		}
		console.log(this.resources);
	}
	protected createResource(): Loadable {
		return new DEFAULT_LOADABLE();
	}

}

