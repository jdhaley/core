import {Value, Type, Bundle, constant} from "../api/model.js";

export class Contract implements Type  {
	constructor(contract: Bundle<Value>) {
		this.contract = contract || Object.create(null)
	}
	contract: Bundle<Value>

	get type() {
		return TYPE;
	}

	at(key: string): Value {
		return this.contract[key]
	}
	generalizes(type: Type): boolean {
		if (type == this) return true;
		for (let key in this.contract) {
			let thisType = this.at(key).type;
			let thatType = type.at(key)?.type;
			if (!thatType || !thisType.generalizes(thatType)) return false;
		}
		return true;
	}
	categorizes(value: any): boolean {
		return value?.type ? this.generalizes(value.type) : false;
	}
	freeze() {
		Object.freeze(this.contract);
		Object.freeze(this);
	}
}
//The contract must be filled in or replaced by compilation.
const TYPE = new Contract(Object.create(null));

export class Interface extends Contract {
	constructor(name?: string, members?: Bundle<Value>) {
		super(members || Object.create(null));
		this.name = name || "";
	}
	name: string
	implement: Contract[];
}

export class Class extends Interface {
	extend: Class;
	generalizes(type: Type) {
		return type instanceof Class /*&& this.super.generalizes(type.super)*/ && super.generalizes(type);
	}
}

export class Producer extends Contract {
	constructor(contract: Contract, product: Type) {
		super(contract.contract);
		this.product = product;
	}
	product: Type
	generalizes(type: Type): boolean {
		if (type instanceof Producer) {
			if (this.product.generalizes(type.product)) return true;
		}
		return super.generalizes(type);
	}
}

export class Signature extends Producer {
	receiver?: Type
	input: Tuple
	//NOTE - the rest arg can be handled through a modifier
	constructor(FUNCTION_TYPE: Contract, receiver: Type, input: Tuple, product: Type) {
		super(FUNCTION_TYPE, product);
		this.receiver = receiver;
		this.input = input;
		this.freeze();
	}
	generalizes(type: Type): boolean {
		if (type instanceof Signature) {
			if (this.receiver && !this.receiver.generalizes(type.receiver)) return false;
			if (this.product && !this.product.generalizes(type.product)) return false;
			//For the input the generalization works the other way.
			//i.e. the overloading function must accept this function's signature.
			if (!type.input.generalizes(this.input)) return false;
			return super.generalizes(type.receiver);
		}
		return false;
	}
	categorizes(value: any): boolean {
		return this.input.categorizes(value);
	}
}

export class Tuple extends Contract {
	types: Type[]
	constructor(struct: Bundle<Value>) {
		super(Object.create(null));
		this.types = [];
		for (let key of Object.keys(struct)) {
			let value = struct[key];
			this.contract[key] = value;
			this.types.push(value.pure);
		}
		Object.freeze(this);
	}
	generalizes(type: Type): boolean {
		if (type == this) return true;
		if (type instanceof Tuple) {
			if (this.types.length > type.types.length) return false;
			for (let i = 0; i < this.types.length; i++) {
				if (!this.types[i].generalizes(type.types[i])) return false;
			}
		}
		return false;
	}
	categorizes(value: any[]): boolean {
		if (value instanceof Array && value.length >= this.types.length) {
			let types = this.types;
			for (let i = 0; i < types.length; i++) {
				if (!types[i].categorizes(value[i])) return false;
			}
			return true;
		}
		return false;
	}
}

abstract class Types implements Type {
	constructor(types: Type[], freeze = true) {
		this.types = types;
		if (freeze) Object.freeze(this);
	}
	at(key: string): Value {
		throw new Error("Method not implemented.");
	}
	generalizes(type: Type): boolean {
		throw new Error("Method not implemented.");
	}
	categorizes(value: any): boolean {
		throw new Error("Method not implemented.");
	}
	type?: Type;
	pure?: any;
	types: Type[]
}

export class Union extends Types {
	constructor(types: Type[]) {
		super(types);
	}
	generalizes(type: Type): boolean {
		if (type == this) return true;
		for (let thisType of this.types) {
			if (thisType.generalizes(type)) return true;
		}
		return false;
	}
}

export class Domain extends Types {
	instance: Bundle<Type>
	constructor(values: constant[]) {
		let types: LiteralType[] = [];
		for (let value of values) {
			types.push(new LiteralType(value));
		}
		super(types, false);
		this.instance = {};
		for (let type of types) {
			this.instance["" + type.value] = type;
		}
		Object.freeze(this);
	}
}

export class LiteralType implements Type {
	constructor(value: constant) {
        this.value = value;
		Object.freeze(this);
    }
	at(key: string): Value {
		throw new Error("Method not implemented.");
	}
	type?: Type;
	pure?: any;
    value: constant;

	generalizes(type: Type): boolean {
		return type instanceof LiteralType && type.value === this.value;
	}
	categorizes(value: constant): boolean {
		return value === this.value;
	}
}
