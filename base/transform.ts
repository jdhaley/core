export interface Context<T> {
	container?: T,
	level?: number, 
}

export type Transform<S, T> = (source: S, context?: Context<T>) => T;

export interface Transformer<S, T> {
	transform: Transform<S, T>
	target?: Transform<T, S>
}

class Process<I, P, O> {
	input: Transform<I, P>
	processor: Transform<P,P>;
	output: Transform<P, O>
//	target: Transform<O, I>
	transform(source: I): O {
		let p = this.input(source);
		p = this.processor(p);
		return this.output(p);
	}
	functionalize(): Transform<I, O> {
		return this.transform.bind(this);
	}
}

class Processors<P> {
	processors: Transform<P,P>[] = [];
	transform(p: P): P {
		for (let processor of this.processors) p = processor(p);
		return p;
	}
	functionalize(): Transform<P, P> {
		return this.transform.bind(this);
	}
}