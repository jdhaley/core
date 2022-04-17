interface Resource {
	//pure?: any //this can provide the marker for compilation.
	isClosed?: boolean;
	/** close() is not required to do anything, i.e. isClosed may be true after close() */
	close(): void;
}

interface Producer<T> extends Iterable<T>, Resource {
}

/*
	NOTE: A Consumer can be a stable Sequence source, therefore
	append() shouldn't alter the sub sequences created from this instance.
*/
export interface Consumer<T> {
	append(...data: T[]): void;
}

export interface Buffer<T> extends Consumer<T>, Producer<T>, Resource {
	clear(): void; //clear is from Set semantic and possibly others.
}
