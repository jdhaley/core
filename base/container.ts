import {Bundle} from "../api/model.js";
import {Value, Type} from "../api/value.js";

export interface Parcel<K, V> {
	at(key: K): V;
} 

type Key = string | number;

export abstract class Container<T> {
	abstract at(key: Key): T;
	abstract put(key: Key, value: T): void;
}

interface Entries<K, V> extends Parcel<K, V> {
	//type: ContainerType[key, value]
	keys(): Iterable<K>;
	values(): Iterable<V>;
	entries(): Iterable<[K, V]>
}
interface Stream {
	close(): void;
	add(): void;
}
abstract class X<T> implements Container<T> {
	type: Type;
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

export class ParcelImpl<T> implements Container<T>, Value {
	constructor(type: Type, from?: ParcelImpl<T> | Bundle<T>) {
		this.type = type;
		this.#members = from instanceof ParcelImpl ? Object.create(from.#members) : (from || Object.create(null));
	}
	#members: Bundle<T>;
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

export class Sequence<T> implements Container<T> {
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