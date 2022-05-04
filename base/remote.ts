import {Bundle, serial} from "../api/model.js";
import {Receiver, Transmitter, Signal, Message} from "../api/signal.js";

export class Request extends Message {
	constructor(subject: string, from: Receiver | Function, to: string, body?: any) {
		super(subject, from);
		this.to = to;
		this.body = body;
	}
	/** The request.from becomes the response receiver. */
	//from: Receiver | Function
	to: string;
	body?: any /* serial | Buffer */;

	method?: "HEAD" | "GET" | "PUT" | "PATCH" | "POST";
	headers?: {
		[key: string]: string
	}

}

export class Response<T> extends Message {
	constructor(request: Request, from: any) {
		super(request.subject, from);
		this.req = request;
	}
	readonly req: Request;
	statusCode: number;
	body: T; /* serial | Buffer | Element */
}

class Remote implements Transmitter, Receiver {
	/** Send the request to a service. */
	send(request: Request) {
		let xhr = this.prepare(request);
		let body = request.body;
		let content = typeof body != "string" ? JSON.stringify(body) : body;
		xhr.send(content);
	}
	/** Only responses are processed, other signals are ignored. */
	receive(message: Response<any>): void {
		let from = message.req?.from;
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
		return request.to;
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
				break;
		}
	}
	protected createRemoteRequest(request: Request): XMLHttpRequest {
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => this.monitor(xhr);
		xhr["request"] = request;
		return xhr;
	}
	protected createResponse(xhr: any): Response<string> {
		let msg = new Response<string>(xhr.request, this);
		msg.statusCode = xhr.status;
		msg.body = xhr.responseText;
		return msg;
	}
}

export class Origin extends Remote {
	constructor(origin?: string) {
		super();
		this.origin = origin || "";
		this.resources = Object.create(null);
	}
	origin: string
	resources: Bundle<any>;

	protected getEndpoint(request: Request) {
		return this.origin + request.to;
	}

	open(path: string, from?: Receiver | Function, subject?: string) {
		let req = new Request(subject || "opened", from, path);
		req.method = "GET"
		this.send(req);
	}
	save(path: string, body: serial, from?: Receiver | Function, subject?: string) {
		let req = new Request(subject || "saved", from, path, body);
		req.method = "PUT";
		this.send(req);
	}
	receive(response: Response<string>): void {
		let existing = this.resources[response.req.to];
		if (existing) response["prior"] = existing;
		this.resources[response.req.to] = response;
		super.receive(response);
	}
}

