import {bundle} from "../api/util.js";
import {Request} from "./request.js";

export default function start(serverConf: bundle<any>, serviceConf: bundle<any>) {
	let modules = serverConf.modules;
	console.info(`Service file context "${modules.fs.realpathSync(".")}"`)
	let service = startService(modules, {}, serviceConf);
	const httpServer = modules.http.createServer(service);
	httpServer.listen(serverConf.server.port, () => console.info());
	console.info(`Service listening on HTTP port "${serverConf.server.port}"`)	
}

function startService(modules: bundle<any>, context: bundle<any>, endpoints: bundle<any>) {
	let conf = {
		modules: modules,
		engine: modules.express,
		context: context
	};
	let app = modules.express();
	app.use(modules.bodyParser.text({type: "text/plain"}));
	config(conf, app, endpoints);
	return app;
}

function config(conf: bundle<any>, ctx: any, endpoints: bundle<any>) {
	for (let path in endpoints) {
		let action = createAction(endpoints[path], conf, ctx);
		ctx.use(path, action);
	}
}

function createAction(endpoint: any, conf: bundle<any>, ctx: any) {
	let action: any;
	switch (typeof endpoint) {
		case "string":
			action = conf.engine.static(endpoint);
			break;
		case "object":
			action = conf.engine.Router();
			config(conf, ctx, endpoint);
			break;
		case "function":
			function service(req: Request) {
				let res = req["res"];
				res.fs = conf.modules.fs;
				res.context = conf;
				return endpoint(res);
			}
			action = service;
			break;
	}
	return action;
}
