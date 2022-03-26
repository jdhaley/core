import {Signal} from "./signal";
import {Parcel} from "./util";

//Modelled after Express
export interface Request /*extends Signal*/ {
	context: any;
	method: string;
	path: string;
	query: Parcel<string>;
	body: Parcel<any>;
	cookies: Parcel<string>;
	signedCookies: Parcel<string>;
	get(header: string): string,
	res: Response;
	fs: FileSystem;
}

interface Response {
	cookie(name: string, value: any, options?: Parcel<string>): void;
	clearCookie(name: string, options?: Parcel<string>): void;
	set(headers: Parcel<string>): void;
	type(type: string): void;
	send(content: any): void;
	sendStatus(status: number): void;
}

interface FileSystem {
	readFileSync(path: string): string;
	writeFileSync(path: string, content: string): void;
	existsSync(path: string): boolean;
}