

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

export interface Part extends Receiver {
	partOf?: Part;
	parts: Iterable<Part>;
}
