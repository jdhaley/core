// /** A Strand contains a fixed sequence
// 	The strand's sequence is immutable: the length and at-values are fixed.
// 	This makes it possible to build flyweight sub-strands from a strand.
//  */
// 	interface Strand<T> extends Sequence<T> {
// 	}
	
// 	interface String extends Strand<String> {
// 	}
	
// 	//strings & arrays are implementations of Sequences...
// 	const x: String = "hello";
// 	const y: Sequence<number> = [] as number[];