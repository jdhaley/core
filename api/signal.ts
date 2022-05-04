

export type direction = "up" | "down";

export interface Signal {
	readonly direction: direction;
	/** The from represents the Transmitter (sender), control path ("parent" or "child"), last receiver, string path, etc... */
	from: any;
	subject: string;
}

export interface Receiver {
	receive(signal: Signal): void;
}

export interface Controller {
	[key: string]: (this: Receiver, signal: Signal) => void;
}

export interface Transmitter {
	send(signal: Signal): void;
}

export interface Sensor {
	sense(signal: Signal): void;
}

export class Message implements Signal {
	constructor(subject: string, from?: Receiver | Function) {
		this.subject = subject;
		this.from = from || null;
	}
	from: Receiver | Function;
	subject: string;
	//[key: string]: any;

	get direction(): direction {
		return "down";
	}
}