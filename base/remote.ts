import {Bundle, serial} from "../api/model.js";
import {Receiver, Signal} from "../api/signal.js";
import {Message} from "./control.js";

class Remote {
	remote(request: Request) {
		let xhr = this.prepare(request);
		let body = request.body;
		let content = typeof body != "string" ? JSON.stringify(body) : body;
		xhr.send(content);
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
				let message = this.createResponse(xhr);
				if (typeof xhr.request.from == "function") {
					xhr.request.from(message);
				} else {
					xhr.request.from.receive(message);
				}
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

export interface Request {
	subject: string;
	from: Receiver | Function
	url: string;
	method?: "HEAD" | "GET" | "PUT" | "PATCH" | "POST";
	headers?: Bundle<string>
	body?: serial /*| Buffer */;
}

export interface Response extends Signal {
	request: Request;
	status: number;
	response: string;
}

export class Origin extends Remote {
	constructor(origin?: string) {
		super();
		this.origin = origin || "";
	}
	origin: string;
	open(receiver: Receiver, path: string, subject?: string) {
		this.remote({
			subject: subject || "opened",
			from: receiver,
			url: path,
			method: "GET"
		});
	}
	save(receiver: Receiver, path: string, body: serial, subject?: string) {
		this.remote({
			subject: subject || "saved",
			from: receiver,
			url: path,
			method: "PUT",
			body: body
		});
	}
	protected getEndpoint(request: Request) {
		return this.origin + request.url;
	}
}

