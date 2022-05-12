export interface Commandable<R> {
	undo(): R;
	redo(): R;
}

export abstract class Command<R> {
	prior: Command<R>;
	next: Command<R>;
	abstract get name(): string;
	abstract undo(): R;
	abstract redo(): R;
}

export class CommandBuffer<T> implements Commandable<T> {
	command = {} as Command<T>;
	undo() {
		if (!this.command.prior) return;
		let ret = this.command.undo();
		this.command = this.command.prior;   
		return ret;
	}
	redo() {
		if (!this.command.next) return;
		this.command = this.command.next;
		return this.command.redo();
	}
	add(command: Command<T>) {
		this.command.next = command;
		command.prior = this.command;
		this.command = command;
	}
}

