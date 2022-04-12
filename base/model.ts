export type serial = string | number | boolean | null | Bundle<serial> | Array<serial>;

export interface Bundle<T> {
	[key: string]: T
}

export interface Parcel<K, V> {
	at(key: K): V;
}

export interface Consumer<K, V> {
	put(key: K, value: V): void;
}
