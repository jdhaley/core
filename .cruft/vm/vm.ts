export class VM {
	#stack = []
	#heap = [];
	#sp = -1;
	get add() {
		let op = get(this.#stack, this.#sp--);
		let r = get(this.#stack, this.#sp);
		set(this.#stack, this.#sp, r + op)
		return this;
	}
	get sub() {
		this.#stack[this.#sp - 1] -= this.#stack[this.#sp]; this.#sp--;
		return this;
	}
	get mul() {
		this.#stack[this.#sp - 1] *= this.#stack[this.#sp]; this.#sp--;
		return this;
	}
	get div() {
		this.#stack[this.#sp - 1] /= this.#stack[this.#sp]; this.#sp--;
		return this;
	}
	get mod() {
		this.#stack[this.#sp - 1] %= this.#stack[this.#sp]; this.#sp--;
		return this;
	}
	get load() {
		this.#stack[this.#sp] = this.#heap[this.#stack[this.#sp]];
		return this;
	}
	get store() {
		let type = getType(this.#stack, this.#sp - 1);
		let heap = get(this.#stack, this.#sp);
		setType(this.#heap, heap, type);
		set(this.#heap, get(this.#stack, this.#sp), get(this.#stack, this.#sp - 1));
		this.#sp--;
		return this;
	}
	push(num: number, type: number) {
		setType(this.#stack, this.#sp + 1, type);
		set(this.#stack, ++this.#sp, num);
		return this;
	}

}


function getType(seg: number[], addr: number) {
	let ea = get(seg, addr);
	let off = Math.round(addr % 16);
	let hdr = seg[ea - off];
	return hdr ? hdr[off] : -1;
}
function setType(seg: number[], addr: number, type: number) {
	let ea = get(seg, addr);
	let off = Math.trunc(ea % 16);
	if (seg[ea - off] === undefined) (seg as any[])[ea - off] = [];
	seg[ea - off][off] = type;
}

function get(seg: number[], addr: number) {
	return seg[addr + 1 + Math.trunc(addr / 15)];
}

function set(seg: number[], addr: number, value: number) {
	seg[addr + 1 + Math.trunc(addr / 15)] = value;
}

export class Memory {
	#data = []
}
let vm = new VM();

for (let i = 0; i < 64; i++) vm.push(i, 1);
vm.push(-2, 4).push(-1, 4).push(10, 4).push(20, 4).add.push(0, 4).store;
console.log(vm);