import {Value, Producer, Type, Signature} from "../api/model.js";
import {bundle, key} from "../api/util.js";

import {ProductType} from "../base/type.js";


export interface Container<K, V> extends Producer<K, V> {
	type: Signature;
	//keys: Iterable<K>
	put(key: K, value: V): void;
}

export abstract class Collection<K, V> implements Container<K, V> {
	abstract get type(): Signature;
	abstract get keys(): Iterable<K>
	abstract at(key: K): V;
	abstract put(key: K, value: V): void;
}

abstract class X<T> extends Collection<key, T> {
	type: Signature;
	pure: any;
	keys: IterableIterator<key>;
	get isClosed(): boolean {
		return Object.isFrozen(this);
	}
	abstract at(key: key): T
	put(key: key, value: T): void {
		if (this.isClosed) throw new Error("Object is frozen");
	}
	close(): void {
		Object.freeze(this);
	}
}

// export class ParcelImpl<T> implements Collection<string, T>, Value {
// 	constructor(type: ProductType, from?: ParcelImpl<T> | bundle<T>) {
// 		this.type = type;
// 		this.#members = from instanceof ParcelImpl ? Object.create(from.#members) : (from || Object.create(null));
// 	}
// 	#members: bundle<T>;
// 	type: ProductType;
// 	get pure() {
// 		return this;
// 	}
// 	// get keyedBy(): "string" {
// 	// 	return "string"
// 	// }
// 	get keys(): Iterable<string> {
// 		return Object.keys(this.#members);
// 	}
// 	at(name: string): T {
// 		return this.#members[name];
// 	}
// 	put(name: string, value: T) {
// 		this.#members[name] = value;
// 	}
// 	get isClosed() {
// 		return Object.isFrozen(this.#members);
// 	}
// 	close() {
// 		Object.freeze(this.#members);
// 		Object.freeze(this);
// 	}
// }
// export class Sequence<T> implements Collection<number, T> {
// 	constructor(from?: Sequence<T>) {
// 		this.#members = from instanceof Sequence ? Object.create(from.#members) : (from || []);
// 	}
// 	#members: T[];

// 	[Symbol.iterator](): Iterator<T, any, undefined> {
// 		return this.#members[Symbol.iterator]();
// 	}
// 	type: ProductType;
// 	get pure() {
// 		return this;
// 	}
// 	get isClosed() {
// 		return Object.isFrozen(this.#members);
// 	}
// 	close() {
// 		Object.freeze(this.#members);
// 		Object.freeze(this);
// 	}
// 	get keys() {
// 		return this.#members.keys();
// 	}
// 	get length() {
// 		return this.#members.length;
// 	}
// 	at(index: number): T {
// 		return this.#members[index];
// 	}
// 	put(index: number, value: T) {
// 		this.#members[index] = value;
// 	}
// 	freeze() {
// 		Object.freeze(this.#members);
// 		Object.freeze(this);
// 	}
// }

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