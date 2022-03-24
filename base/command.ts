export interface Commandable<R> {
	undo(): R;
	redo(): R;
}

export abstract class Command<R> implements Commandable<R> {
	prior: Command<R>;
	next: Command<R>;
	abstract get name(): string;
	abstract undo(): R;
	abstract redo(): R;
}