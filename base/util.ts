export interface Parcel<T> {
	[key: string]: T
}

export type serial = string | number | boolean | null | serial[] | Serial;

interface Serial extends Parcel<serial> {
	[key: string]: serial
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
