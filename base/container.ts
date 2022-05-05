import {Value, Type, Parcel, Bundle} from "../api/model.js";
import {Producer} from "./type.js";

type Key = string | number;

interface Stream {
	close(): void;
	add(): void;
}

export interface Container<K, V> extends Parcel<K, V> {
//	type: ContainerType;
	put(key: K, value: V): void;
	// keys(): Iterable<K>;
	// values(): Iterable<V>;
//	entries(): Iterable<[K, V]>
}

export abstract class Collection<K, T> implements Container<K, T> {
	abstract get type(): Producer;
	abstract at(key: K): T;
	abstract put(key: K, value: T): void;
}

abstract class X<T> implements Collection<Key, T> {
	type: Producer;
	pure: any;
	keys: Iterable<Key>;
	get isClosed(): boolean {
		return Object.isFrozen(this);
	}
	abstract at(key: Key): T
	put(key: Key, value: T): void {
		if (this.isClosed) throw new Error("Object is frozen");
	}
	close(): void {
		Object.freeze(this);
	}
}

export class ParcelImpl<T> implements Collection<string, T>, Value {
	constructor(type: Producer, from?: ParcelImpl<T> | Bundle<T>) {
		this.type = type;
		this.#members = from instanceof ParcelImpl ? Object.create(from.#members) : (from || Object.create(null));
	}
	#members: Bundle<T>;
	type: Producer;
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

export class Sequence<T> implements Collection<number, T> {
	constructor(from?: Sequence<T> | Array<T>) {
		this.#members = from instanceof Sequence ? Object.create(from.#members) : (from || []);
	}
	#members: T[];

	[Symbol.iterator](): Iterator<T, any, undefined> {
		return this.#members[Symbol.iterator]();
	}
	type: Producer;
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
		return this.#members.keys();
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

// class Range {
// 	constructor(start: number, end: number) {
// 		this.start = start;
// 		this.end = end;
// 	}
// 	start: number
// 	end: number
// 	*[Symbol.iterator](): Iterator<number, any, undefined> {
// 		for (let i = this.start; i < this.end; i++) yield i;
// 	}
// }