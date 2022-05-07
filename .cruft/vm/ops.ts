const any = {
	eq(r: any, op: any) {
		return r === op;
	},
	ne(r: any, op: any) {
		return r !== op;
	},
	and(r: any, op: any) {
		return r && op;
	},
	or(r: any, op: any) {
		return r || op;
	},
	andor(r: any, and: any, or: any) {
		return  r ? and : or;
	}
}
const number = {
	not(r: number) {
		return !r;
	},
	add(r: number, op: number) {
		return r + op;
	},
	sub(r: number, op: number) {
		return r - op;
	},
	mul(r: number, op: number) {
		return r * op;
	},
	div(r: number, op: number) {
		return r / op;
	},
	mod(r: number, op: number) {
		return r % op;
	},
	gt(r: number, op: number) {
		return r > op;
	},
	lt(r: number, op: number) {
		return r < op;
	},
	ge(r: number, op: number) {
		return r >= op;
	},
	le(r: number, op: number) {
		return r <= op;
	}
}
const bit = {
	not(r: number) {
		return ~r;
	},
	and(r: number, op: number) {
		return r & op;
	},
	or(r: number, op: number) {
		return r | op;
	},
	xor(r: number, op: number) {
		return r ^ op;
	},
	shl(r: number, op: number) {
		return r << op;
	},
	shr(r: number, op: number) {
		return r >> op;
	}
}
