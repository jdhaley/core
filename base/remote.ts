import {Bundle, serial} from "../api/model.js";
import {Receiver, Transmitter, Request, Response, Signal} from "../api/signal.js";
import {Message} from "./control.js";

class Remote implements Transmitter, Receiver {
	send(request: Request) {
		let xhr = this.prepare(request);
		let body = request.body;
		let content = typeof body != "string" ? JSON.stringify(body) : body;
		xhr.send(content);
	}
	receive(message: Signal): void {
		let from = message["request"]?.from;
		if (typeof from == "function") {
			from(message);
		} else if (from?.receive) {
			from.receive(message);
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
		let msg = new Message(xhr.request.subject, this) as Response;
		msg.request = xhr.request,
		msg.body = xhr.responseText,
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

	open(path: string, from?: Receiver | Function, subject?: string) {
		if (subject == "use" && this.resources[path]) return;
		let resource = this.createResource();
		this.resources[path] = resource;

		let msg = new Message(subject || "opened") as Request;
		msg.from = from,
		msg.url = path,
		msg.method = "GET"
		this.send(msg);
	}
	save(path: string, body: serial, from?: Receiver | Function, subject?: string) {
		let req = new Message(subject || "saved") as Request;
		req.from = from;
		req.url = path;
		req.method = "PUT";
		req.body = body;
		this.send(req);
	}
	protected getEndpoint(request: Request) {
		return this.origin + request.url;
	}
	receive(response: Response): void {
		let resource = this.resources[response.request.url];
		//if (!resource || resource.source !== undefined) throw new Error("Error loading content.");
		if (response.status == 200) {
			let doc = new DOMParser().parseFromString(response.body, "text/xml");
			resource.load(doc.documentElement);
		} else {
			resource.source = null;
			console.error(`Note "${response.request.url}" not found.`);
		}
		console.log(this.resources);
		super.receive(response);
	}
	protected createResource(): Loadable {
		return new DEFAULT_LOADABLE();
	}

}

