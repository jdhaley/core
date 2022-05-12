import {Signal, Receiver, direction} from "../api/signal.js";

export class Message<T> implements Signal {
	constructor(subject: string, from: Receiver | Function, to?: any, body?: T) {
		this.subject = subject;
		this.from = from;
		if (to) this.to = to;
		if (body) this.body = body;
	}
	subject: string;
	from: any;
	/** The path, control, etc. */
	declare to?: any;
	declare body?: T; // serial | Buffer	//naming compatibility with Express.js
	
	//[key: string]: any;

	get direction(): direction {
		return "down";
	}
}

export class Response<T> extends Message<T> {
	constructor(request: Message<unknown>, from: any, status: number, body?: T) {
		super(request.subject, from, null, body);
		this.req = request;
		this.statusCode = status;
	}
	readonly req: Message<unknown>;	//naming compatibility with Express.js
	readonly statusCode: number;	//naming compatibility with Express.js
}

//DEVT only
class Circuit implements Receiver {
	constructor(receiver: Receiver, from?: Circuit) {
		this.receiver = receiver;
		this.from = from;
	}
	receiver: Receiver;
	from: Circuit;

	receive(signal: Signal): void {
		this.receiver.receive(signal);
	}
}