import {bundle, serial} from "../api/util.js";
import {Receiver, Transmitter, Message, Response} from "../api/signal.js";

class Request extends Message<any> {
	constructor(subject: string, from: Receiver | Function, to: string, body?: any) {
		/* "from" becomes the response receiver. */
		super(subject, from);
		this.to = to;
		this.body = body;
	}

	//HTTP specific

	method?: "HEAD" | "GET" | "PUT" | "PATCH" | "POST";
	headers?: {
		[key: string]: string
	}
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
		return new Response<string>(xhr.request, this, xhr.status, xhr.responseText);
	}
}

export class RemoteFileService extends Remote {
	constructor(origin?: string) {
		super();
		console.info("Remote File Service:", origin);
		this.location = new URL(origin || "");
		this.responses = Object.create(null);
	}
	location: Location
	responses: bundle<Response<any>>;

	protected getEndpoint(request: Request) {
		return this.location + request.to;
	}

	open(path: string, from?: Receiver | Function, subject?: string) {
		if (subject == "use" && this.responses[path]) {
			//BROKEN - need to check that it is the same "from".
			super.receive(this.responses[path]);
		} else {
			let req = new Request(subject || "open", from, path);
			req.method = "GET"
			this.send(req);	
		}
	}
	save(path: string, body: serial, from?: Receiver | Function, subject?: string) {
		let req = new Request(subject || "save", from, path, body);
		req.method = "PUT";
		this.send(req);
	}
	receive(response: Response<string>): void {
		let existing = this.responses[response.req.to];
		if (existing) response["prior"] = existing;
		this.responses[response.req.to] = response;
		super.receive(response);
	}
}

//documentation from MDN.
export interface Location {
	/** A stringifier that returns a USVString containing the whole URL. */
	href: string;

	/** A USVString containing the protocol scheme of the URL, including the final ':'. */
	protocol: string
	/** A USVString containing the domain of the URL. */
	hostname: string;
	/** A USVString containing the port number of the URL. */
	port: string
	/** Is a USVString containing an initial '/' followed by the path of the URL, not including the query string or fragment. */
	pathname: string;
	/** A USVString indicating the URL's parameter string; if any parameters are provided, this string includes all of them, beginning with the leading ? character. */
	search: string;
	/** A USVString containing a '#' followed by the fragment identifier of the URL. */
	hash: string;

	//////// username and password are not in a Document.location ////////////
	// /** A USVString containing the username specified before the domain name. */
	// username: string;
	// /** A USVString containing the password specified before the domain. */
	// password: string;
	
	/** Returns a USVString containing the origin of the URL, that is its scheme, its domain and its port.*/
	//readonly origin: string;
	/** A USVString containing the domain (that is the hostname) followed by (if a port was specified) a ':' and the port of the URL. */
	//readonly host: string;

	////* A URLSearchParams object which can be used to access the individual query parameters found in search. */
	//readonly searchParams
}

