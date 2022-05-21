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
	peek() {
		return this.#command;
	}
}

