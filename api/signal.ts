

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

export interface Request extends Signal {
	/** The request.from becomes the response receiver. */
	from: Receiver | Function
	to: string;
	method?: "HEAD" | "GET" | "PUT" | "PATCH" | "POST";
	headers?: {
		[key: string]: string
	}
	body?: any /* serial | Buffer */;
}

export interface Response extends Signal {
	request: Request;
	status: number;
	body: any; /* serial | Buffer | Element */
}
