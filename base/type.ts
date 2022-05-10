import {Value, Type, Signature} from "../api/model.js";
import {bundle, constant} from "../api/util.js";

/*
	TODO: consider ContentType
	- product type
	- attributes
	- names (sequence or choice)
*/
// class ContentType implements Type {
// 	at(key: string): Value {
// 		throw new Error("Method not implemented.");
// 	}
// 	generalizes(type: Type): boolean {
// 		if (type instanceof ContentType) {

// 		}
// 		return false;
// 	}
// 	categorizes(value: Content<any>): boolean {
// 		value.type
// 		throw new Error("Method not implemented.");
// 	}
// 	type?: Type;
// 	pure?: any;
	
// }
export class Contract implements Type  {
	constructor(contract: bundle<Value>) {
		this.contract = contract || Object.create(null)
	}
	contract: bundle<Value>

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
	close() {
		Object.freeze(this.contract);
		Object.freeze(this);
	}
}
//The contract must be filled in or replaced by compilation.
const TYPE = new Contract(Object.create(null));


export class Class extends Contract {
	constructor(name?: string, members?: bundle<Value>) {
		super(members || Object.create(null));
		this.name = name || "";
	}
	name: string
	extend: Class;
	implement: Contract[];

	generalizes(type: Type) {
		return type instanceof Class /*&& this.super.generalizes(type.super)*/ && super.generalizes(type);
	}
}

export class ProductType extends Contract implements Signature {
	constructor(contract: bundle<Value>, input: Type, output: Type) {
		super(contract);
		this.input = input;
		this.output = output;
	}
	input: Type;
	output: Type;

	generalizes(type: Type) {
		return (type instanceof ProductType
			&& super.generalizes(type)
			&& this.input.generalizes(type.input)
			&& this.output.generalizes(type.output)
		) ? true : false;
	}

}

export class FunctionType extends ProductType {
	declare input: Tuple
	constructor(contract: bundle<Value>, input: Tuple, product: Type) {
		super(contract, input, product);
	}
	generalizes(type: Type): boolean {
		return (type instanceof ProductType
			&& super.generalizes(type)
			//// The difference between a function and container is the generalizaton relatonship here
			&& type.input.generalizes(this.input)
			&& this.output.generalizes(type.output)
		) ? true : false;
	}
}

export class Tuple extends Contract {
	types: Type[]
	constructor(struct: bundle<Value>) {
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
	instance: bundle<Type>
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
