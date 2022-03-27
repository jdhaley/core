export interface Context<T> {
	container?: T,
	level?: number, 
}

export type Transform<S, T> = (source: S, context?: Context<T>) => T;

export interface Transformer<S, T> {
	transform: Transform<S, T>
	target: Transform<T, S>
}
