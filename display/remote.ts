import {Receiver, Message} from "../../core/base/core.js";

type serial = string | number | boolean | null | serial[] | Serial;

interface Serial {
	[key: string]: serial
}

interface RemoteRequest {
	url: string;
	method?: "HEAD" | "GET" | "PUT" | "PATCH" | "POST";
	body?: serial /*| Buffer */;
}

export class Remote {
	open(receiver: Receiver, url: string, subject?: string) {
		let message = this.process(receiver, subject || "opened", {
			url: url,
			method: "GET"
		});
	}
	save(receiver: Receiver, url: string, body: serial, subject?: string) {
		let message = this.process(receiver, subject || "saved", {
			url: url,
			method: "PUT",
			body: body
		});
	}
	process(receiver: Receiver, subject: string, request: RemoteRequest) {
		let xhr = this.createHttpRequest(receiver, subject, request);
		this.prepare(xhr);
		let content = request.body;
		if (typeof content != "string") content = JSON.stringify(content);
		xhr.send(content);
	}

	protected prepare(xhr: any) {
		let req = xhr.request;
		xhr.open(req.method || "HEAD", req.url || "");
		req.headers && this.setHeaders(xhr, req.headers)
	}
	protected setHeaders(xhr: any, headers: any) {
		for (let name in headers) {
			let value = headers[name];
			value && xhr.setRequestHeader(name, value);
		}
	}
	protected monitor(xhr: any) {
		switch (xhr.readyState) {
			case 0: // UNSENT Client has been created. open() not called yet.
			case 1: // OPENED open() has been called.
			case 2: // HEADERS_RECEIVED send() has been called, and headers and status are available.
			case 3:	// LOADING Downloading; responseText holds partial data.
				break;
			case 4: // DONE The operation is complete.
				let message = this.createMessage(xhr);
				if (typeof xhr.receiver == "function") {
					xhr.receiver(message);
				} else {
					xhr.receiver.receive(message);
				}
			}
	}
	protected createHttpRequest(receiver: Receiver, subject: string, request: RemoteRequest): XMLHttpRequest {
		let xhr = new XMLHttpRequest() as any;
		xhr.receiver = receiver;
		xhr.subject = subject;
		xhr.request = request;
		xhr.onreadystatechange = () => this.monitor(xhr);
		return xhr;
	}
	protected createMessage(xhr: any) {
		let msg = new Message(xhr.subject, "down") as any;
		msg.request = xhr.request,
		msg.response = xhr.responseText,
		msg.status = xhr.status;
		return msg;
	}
}