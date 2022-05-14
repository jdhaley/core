import {transform} from "../api/model";

export interface Transformer<S, T> {
	transform: transform<S, T>
	target?: transform<T, S>
}

class Process<I, P, O> {
	input: transform<I, P>
	processor: transform<P,P>;
	output: transform<P, O>
//	target: Transform<O, I>
	transform(source: I): O {
		let p = this.input(source);
		p = this.processor(p);
		return this.output(p);
	}
	functionalize(): transform<I, O> {
		return this.transform.bind(this);
	}
}

class Processors<P> {
	processors: transform<P,P>[] = [];
	transform(p: P): P {
		for (let processor of this.processors) p = processor(p);
		return p;
	}
	functionalize(): transform<P, P> {
		return this.transform.bind(this);
	}
}