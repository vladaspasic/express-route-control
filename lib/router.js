var fs = require('fs'),
	Utils = require('./utils'),
	Route = require('./route'),
	root, app;

/*
	Reading Controllers from the file system, from the designated folder
*/
function getRouteHandlers(directory, target) {

	var files = fs.readdirSync(directory);

	Utils.each(files, function(file, key) {

		var fullpath = directory + "/" + file;
		var isDir = fs.statSync(fullpath).isDirectory();
		/*
			If there is a subdirectory fetch all files there and append them.
			Creating parent -> child controller logic.
		*/
		if(isDir) {
			getRouteHandlers(fullpath, target);
		} else {
			var name = file.substr(0, file.lastIndexOf('.'));
			var stripped = directory + "/" + name;
			var path = stripped.replace(root, '');

			/*
				Require Controller Module
			*/

			target[path] = require(stripped);

			/*
				Assign Controller Module to Express Instance
			*/

			assignControllers(path, target[path]);
		}

	});

	return target;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function assignControllers(path, router) {

	var mainFilter = false;

 

	if(endsWith(path, "/index"))
		path = path.replace("/index", "");

	/*
		If exports.filter exists, setup Controller filter, for all paths,
		with exceptions if there is a deny variable set
	*/

	if(router.filters) {
		mainFilter = router.filters;
		addControllerFilter(path, mainFilter);
		delete router.filters;
	}

	Utils.each(router, function(route, key) {

		if(Utils.isFunction(route)) {

			/*			
			Format: exports.action = function() {}
			*/

			buildSimpleRouteObject(path, route, key);

		} else if(Utils.has(route, 'route')) {

			/*
			Format: exports.action = {
				route: function() {},
				...,
				..,
				.
			}	
			*/

			buildRoute(route, path, key);
		} else if(Utils.isObject(route)) {

			/*
			Format: exports.routes = {
				'action': {
					route: function()
				},
				'action': {
					route: function()
				}
				...,
				..,
				.
			}	
			*/

			handleObjectRoute(path, route, key);
		}

	});
}

function handleObjectRoute(path, route, name) {

	Utils.each(route, function(handler, key) {
		if(Utils.isFunction(handler)) {
			buildSimpleRouteObject(path, handler, key);
		} else if(Utils.isObject(handler)) {
			buildRoute(handler, path, key);
		}
	});

}

function buildSimpleRouteObject(path, route, action) {
	var object =  {
		path: path,
		route: route,
		action: action
	};

	return buildRoute(object);
}

function buildRoute(options, path, action) {
	Utils.defaults(options, {
		type: 'get',
		path: path || "/",
		action: action || "/",
		filter: false,
		route: defaultCallback
	});

	var route = new Route(options);

	return addRoute(route);
}

function addRoute(route) {
	/*
		Wrap request handler for context/scope binding
	*/
	var handler = function() {
		return route.handleRequest.apply(route, arguments);
	};

	var type = route.getType();
	var path = route.getFullPath();

	/*
		Adding routes and controllers to Express app instance;
		Example: app.get('controller/action', function());
	*/

	console.info("Route assigned: Method %s, Path: %s", type, path);

	app[type](path, handler);
}

function addControllerFilter(path, filter) {

	/*			
		Format: exports.filter = function() {}
	*/

	if(Utils.isFunction(filter)) {
		filter = {
			filter: filter,
			deny: '*'
		};
	}

	/*
		Format: exports.filter = {
			filter: function() {},
			deny: {'action, action1'}
			..,
			.
		}	
	*/

	Utils.defaults(filter, {
		deny: '*',
		filter: defaultCallback
	});

	/*
		Setup request filters on paths: 'controller' and 'controller/*'
	*/

	if(filter.deny === "*"){
		app.all(path, filter.filter);
		app.all(path + "/*", filter.filter);
	}

	/*
		Setup request filters on paths: 'controller/action' and 'controller/action1'
	*/

	else {
		var actions = filter.deny.split(",");

		Utils.each(actions, function(action) {
			action = action.trim();
			app.all(path + "/" + action, filter.filter);
		});
	}
	
}

function defaultCallback(req, res, next) {
	
	console.info("Route not handled, proceeding to next middleware.");
	
	return next();
}

exports.initialize = function(express, dir) {

	if(Utils.isUndefined(express))
		throw new Error("You must pass an Express instance to bind Routes");

	var routes = [];
	root = dir || './routes';
	app = express;

	getRouteHandlers(root, routes);
};