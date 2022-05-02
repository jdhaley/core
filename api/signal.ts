

export type direction = "up" | "down";

export interface Signal {
	readonly direction: direction;
	from?: Receiver; //The parent or child, based on direction.
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

export interface Request extends Signal {
	sender: Receiver | Function /* | string // path or id */
	url: string;
	method: "HEAD" | "GET" | "PUT" | "PATCH" | "POST";
	// headers?: Bundle<string>
	// body?: serial /*| Buffer */;
	[key: string]: unknown;
}

export interface Response extends Signal {
	request: Request;
	status: number;
	response: string;
}
