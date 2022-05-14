export abstract class Command<T> {
	prior: Command<T>;
	next: Command<T>;

	abstract get name(): string;
	abstract undo(): T;
	abstract redo(): T;
}

export class CommandBuffer<T> {
	//A CommandBuffer always requires an initial Object as the head of the linked list.
	#command: Command<T> = Object.create(null);

	undo() {
		if (!this.#command.prior) return;
		let ret = this.#command.undo();
		this.#command = this.#command.prior;   
		return ret;
	}
	redo() {
		if (!this.#command.next) return;
		this.#command = this.#command.next;
		return this.#command.redo();
	}
	add(command: Command<T>) {
		this.#command.next = command;
		command.prior = this.#command;
		this.#command = command;
	}
	protected peek() {
		return this.#command;
	}
}

export abstract class Editor extends CommandBuffer<Range> {
	abstract edit(name: string, range: Range, replacement: string, offset: number): Range;
	abstract replace(name: string, range: Range, replacement: string): Range;
	abstract insert(range: Range): Range;
	abstract split(range: Range): Range;
	abstract level(name: "Promote" | "Demote", range: Range): Range;
}