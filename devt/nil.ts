export default Object.freeze({
	any: null,
	void: undefined,
	unknown: NaN,
	string: "",
	number: 0,
	boolean: false,
	double: NaN,
	object: Object.freeze({}),
	array: Object.freeze([]),
	function: Object.freeze(() => undefined),
});