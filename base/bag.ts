import {Container, Parcel} from "./model.js";

export abstract class Bag<T> extends Container<T> {
	abstract put(key: string | number, value: T): void
}


export class Bundle<T> extends Bag<T> {
	constructor(from?: Bundle<T> | Parcel<T>) {
		super();
		this.#members = from instanceof Bundle ? Object.create(from.#members) : (from || Object.create(null));
	}
	#members: Parcel<T>;
	// get keyedBy(): "string" {
	// 	return "string"
	// }
	get keys(): Iterable<string> {
		return Object.keys(this.#members);
	}
	at(name: string): T {
		return this.#members[name];
	}
	put(name: string, value: T) {
		this.#members[name] = value;
	}
	freeze() {
		Object.freeze(this.#members);
		Object.freeze(this);
	}
}

export class Sequence<T> extends Bag<T> {
	constructor(from?: Sequence<T> | Array<T>) {
		super();
		this.#members = from instanceof Sequence ? Object.create(from.#members) : (from || []);
	}
	#members: Array<T>;
	get keyedBy(): "number" {
		return "number"
	}
	get keys() {
		return new Range(0, this.length);
	}
	get length() {
		return this.#members.length;
	}
	at(index: number): T {
		return this.#members[index];
	}
	put(index: number, value: T) {
		this.#members[index] = value;
	}
	freeze() {
		Object.freeze(this.#members);
		Object.freeze(this);
	}
}

class Range {
	constructor(start: number, end: number) {
		this.start = start;
		this.end = end;
	}
	start: number
	end: number
	*[Symbol.iterator](): Iterator<number, any, undefined> {
		for (let i = this.start; i < this.end; i++) yield i;
	}
}

