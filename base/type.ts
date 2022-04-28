import {Value, Type, Bundle, constant} from "../api/model.js";
import {Container} from "./container.js";

/*
Type expressions:
expr ^ type - casting
name: expr ^ type 
	- expr or type or both
type:		ident | signature | contract | tuple | union | [sigType [^ type]...]	
sigType:	tuple | <export class extending Container>
	- function and containers.
contract:	{decl (, decl)*} | {}
tuple:		(decl (, decl)*) | ()
union:		[cort (| cort)*]

decl:		facet* name : type
facet:		ident
name:		ident
cort:		const | type

Classes:
signature:	Functional (Function, Method, Constructor, Lambda)
interface:	Interface
tuple:		Class
domain:		Enum
container:	Sequence/Array, Countable/Iterable, 
*/
export class Contract extends Type implements Container<string, Value> {
	constructor(members: Bundle<Value> | Contract) {
		super();
		this.#members = members instanceof Contract ? members.#members : members
	}
	#members: Bundle<Value>
	*[Symbol.iterator](): Iterator<string, any, undefined> {
		for (let key of Object.keys(this.#members)) yield key;
	}
	at(key: string): Value {
		return this.#members[key]
	}
	generalizes(type: Type): boolean {
		if (type == this) return true;
		if (type instanceof Contract) {
			for (let key of this) {
				let thisType = this.at(key).type;
				let thatType = type.at(key)?.type;
				if (!thatType || !thisType.generalizes(thatType)) return false;
			}
			return true;
		} else {
			return false;
		}
	}
	put(name: string, value: Value) {
		this.#members[name] = value;
	}
	freeze() {
		Object.freeze(this.#members);
		Object.freeze(this);
	}
}

export class Interface extends Contract {
	constructor(name?: string, members?: Bundle<Value>) {
		super(members || Object.create(null));
		this.name = name || "";
	}
	name: string
	implement: Contract[];
	generalizes(type: Type) {
		if (!Object.isFrozen) {
			console.warn(`Type "${this.name}" is not frozen.`);
		}
		return type instanceof Interface && super.generalizes(type);
	}
}

export class Class extends Interface {
	extend: Class;
	generalizes(type: Type) {
		return type instanceof Class /*&& this.super.generalizes(type.super)*/ && super.generalizes(type);
	}
}

export class ContainerType extends Contract {
	constructor(contract: Contract, output: Type) {
		super(contract);
		this.output = output;
	}
	input: "string" | "number"
	output: Type
	generalizes(type: Type): boolean {
		if (type instanceof ContainerType) {
			if (this.output.generalizes(type.output)) return true;
		}
		return super.generalizes(type);
	}
}

export class Signature extends Contract {
	receiver?: Type
	input: Tuple
	output?: Type;
	//NOTE - the rest arg can be handled through a modifier
	constructor(FUNCTION_TYPE: Contract, receiver: Type, input: Tuple, output: Type) {
		super(FUNCTION_TYPE);
		this.receiver = receiver;
		this.input = input;
		this.output = output;
//		this.freeze();
	}
	generalizes(type: Type): boolean {
		if (type instanceof Signature) {
			if (this.receiver && !this.receiver.generalizes(type.receiver)) return false;
			if (this.output && !this.output.generalizes(type.output)) return false;
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
			this.put(key, value);
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

abstract class Types extends Type {
	constructor(types: Type[], freeze = true) {
		super();
		this.types = types;
		if (freeze) Object.freeze(this);
	}
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

export class LiteralType extends Type {
	constructor(value: constant) {
        super();
        this.value = value;
		Object.freeze(this);
    }
    value: constant;
	generalizes(type: Type): boolean {
		return type instanceof LiteralType && type.value === this.value;
	}
	categorizes(value: constant): boolean {
		return value === this.value;
	}
}
