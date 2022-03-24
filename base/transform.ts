export {Transformer, Transforms, initialize, transformConf, transformMethods};

type transformMethod<S, T> = (this: Transform<S, T>, source: S, target: T, level?: number) => T;

interface Transform<S, T> {
	transform: transformMethod<S, T>;
	types: Transforms<S, T>;
	[key: string]: unknown;
}

interface Transforms<S, T> {
	[key: string]: Transform<S, T>;
}

interface Transformer<M, V> {
	toView(model: M): V;
	fromView(view: V): M;
}

interface transformMethods<S,T> {
	[key: string]: transformMethod<S, T>
}
//Can be a string naming the method or an object with a type property naming the method.
//An object can contain other transform-specific values as well.
type transformConfValue = string | {type: string, [key: string]: unknown};

interface transformConf {
	[key: string]: transformConfValue;
}
function initialize<S, T>(methods: transformMethods<S,T>, tags: transformConf): Transforms<S, T> {
	let types = {};
	for (let name in tags) {
		let conf = tags[name];
		let type: Transform<S, T>;
		if (typeof conf == "object") {
			type = Object.create(conf) as Transform<S, T>;
			type.transform = methods[conf.type];
		} else {
			type = {
				transform: methods[conf]
			} as Transform<S, T>;
		}
		type.name = name;
		type.types = types;
		if (!type.transform) throw new Error("Invalid configuration");
		types[name] = type;
	}
	return types;
}