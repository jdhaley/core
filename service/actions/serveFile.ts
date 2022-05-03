import {Request, Response} from "../request";

export default function serveFile(res: Response) {
	let req: Request = res.req;
	let f = "./journal" + req.path;
	if (req.method == "GET") {
		if (!res.fs.existsSync(f)) {
			res.sendStatus(404)
		} else {
			let source = res.fs.readFileSync(f);
			res.type("text/plain");
			res.send(source);		
		}
	} else if (req.method == "PUT") {
		res.fs.writeFileSync(f, req.body as any as string);
		res.sendStatus(200);
	}
}
