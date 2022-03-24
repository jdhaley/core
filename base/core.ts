
type direction = "up" | "down";
type action = (this: Receiver, signal: Signal) => void;

export interface Parcel<T> {
	[key: string]: T
}

export interface Actions {
	[key: string]: action;
}

export interface Signal {
	readonly direction: direction;
	from?: Receiver; //The parent or child, based on direction.
	subject: string;
}

export interface Receiver {
	receive(signal: Signal): void;
}

export interface Part extends Receiver {
	partOf?: Part;
	parts: Iterable<Part>;
}

export interface Commandable<R> {
	undo(): R;
	redo(): R;
}

export class Message implements Signal {
	constructor(subject: string, direction: direction) {
		this.subject = subject;
		if (direction) this.direction = direction;
	}
	readonly direction: direction;
	subject: string;
}

export abstract class Command<R> implements Commandable<R> {
	prior: Command<R>;
	next: Command<R>;
	abstract get name(): string;
	abstract undo(): R;
	abstract redo(): R;
}