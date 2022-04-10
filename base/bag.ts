import {Container, Parcel, Type, Value} from "./model.js";

export interface Bag<T> extends Container<T> {
	put(key: string | number, value: T): void;
}

abstract class X<T> implements Bag<T> {
	type: Type;
	pure: any;
	keys: Iterable<string | number>;
	get isClosed(): boolean {
		return Object.isFrozen(this);
	}
	at(key: string | number): T {
		throw new Error("Method not implemented.");
	}
	put(key: string | number, value: T): void {
		if (this.isClosed) throw new Error("Object is frozen");
	}
	close(): void {
		Object.freeze(this);
	}
}
export interface Strand<T> extends Container<T>, Iterable<T> {
	readonly length: number,
	at(index: number): T,
	indexOf(search: T, start?: number): number,
	slice(start?: number, end?: number): Strand<T>,
	concat(...values: T[]): Strand<T>
}

export class Bundle<T> implements Bag<T>, Value {
	constructor(type: Type, from?: Bundle<T> | Parcel<T>) {
		this.type = type;
		this.#members = from instanceof Bundle ? Object.create(from.#members) : (from || Object.create(null));
	}
	#members: Parcel<T>;
	type: Type;
	get pure() {
		return this;
	}
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
	get isClosed() {
		return Object.isFrozen(this.#members);
	}
	close() {
		Object.freeze(this.#members);
		Object.freeze(this);
	}
}

export class Sequence<T> implements Bag<T>, Strand<T> {
	constructor(from?: Sequence<T> | Array<T>) {
		this.#members = from instanceof Sequence ? Object.create(from.#members) : (from || []);
	}
	#members: T[];

	[Symbol.iterator](): Iterator<T, any, undefined> {
		return this.#members[Symbol.iterator]();
	}
	type: Type;
	get pure() {
		return this;
	}
	get isClosed() {
		return Object.isFrozen(this.#members);
	}
	close() {
		Object.freeze(this.#members);
		Object.freeze(this);
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
	indexOf(search: T, start?: number) {
		return this.#members.indexOf(search, start || 0);
	}
	slice(start?: number, end?: number): Strand<T> {
		return this.#members.slice(start, end) as Strand<T>
	}
	concat(...values: T[]) {
		return this.#members.concat(values);
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

