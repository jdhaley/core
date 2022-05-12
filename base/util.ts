
// class Nil {
// 	void = undefined;
// 	value = null;
// 	string = "";
// 	boolean = false;
// 	number = 0;
// 	unknown = NaN;
// }
//type nil = undefined | null | "" | false | 0 | NaN;

// class Empty {
// 	object = Object.freeze(Object.create(null));
// 	array = Object.freeze([]) as pure[];
// 	function = Object.freeze(function nil(any: any): any {});
// }
export const EMPTY = Object.freeze({
	object: Object.freeze(Object.create(null)),
	array: Object.freeze([]) as any[],
	function: Object.freeze(function nil(any: any): any {})
});

//TODO value, sequence and other types defined in core.api
export function typeOf(value: any): string {
	switch (typeof value) {
		case "undefined":
			return "void"
		case "number":
			if (value === NaN) return "unknown";
		case "boolean":
		case "string":
		case "function":
			return typeof value;
		case "object":
			if (value === null) return "any";
			if (typeof value.valueOf == "function") value = value.valueOf();
			if (typeof value != "object") return typeOf(value);
			if (value instanceof Array) return "array";
			if (value.generalizes) return "type";
			return "object";
		case "bigint":
		case "symbol":
		default:
			return "unknown";
	}
}

export function extend(proto: Object, extension: Object) {
	let object = Object.create(proto);
	for (let name in extension) {
		object[name] = extension[name];
	}
	return object;
}

export function formatDate(date: Date) {
	let year    = "" + date.getFullYear();
	let month   = "" + (date.getMonth() + 1); 
	let day     = "" + date.getDate();
	let hour    = "" + date.getHours();
	let minute  = "" + date.getMinutes();
	//let second  = "" + date.getSeconds();

	if (month.length == 1) month = "0" + month;
	if (day.length == 1) day = "0" + day;
	if (hour.length == 1) hour = "0" + hour;
	if (minute.length == 1) minute = "0" + minute;
	return year + month + day + "_" + hour + minute;
}
