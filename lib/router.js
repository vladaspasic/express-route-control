var fs = require('fs'),
	Utils = require('./utils'),
	Route = require('./route'),
	controllers = require('./controller'),
	root, Options, app;

/*
	Reading Controllers from the file system, from the designated folder
*/
function createModules(directory) {

	var files = fs.readdirSync(directory);

	var module = {
		children: [],
		views: false,
		controllers: []
	};

	Utils.each(files, function(file, key) {


		var fullpath = directory + "/" + file;
		var isDir = fs.statSync(fullpath).isDirectory();

		var name = file.substr(0, file.lastIndexOf('.'));
		
		var stripped = directory + "/" + name;
		var path = directory.replace(root, '');
		var urlPath = stripped.replace(root, '');

		module.path = path;
		
		/*
			If there is a subdirectory fetch all files there and append them.
			Creating parent -> child controller logic.
		*/
		if(isDir) {
			if(!Options.viewFolderLocation && file === Options.viewFolderName) {
				module.views = fullpath;
			} else {
				var children = createModules(fullpath);
				module.children.push(children);
			}
		/*
			Check if file is a controller and assign routes
		*/
		} else if(name === Options.mainController || endsWith(name, Options.controllerPrefix)) {

			var isSubController = endsWith(name, Options.controllerPrefix);

			if(isSubController) {
				urlPath = urlPath.replace(Options.controllerPrefix, '');
				name = name.replace(Options.controllerPrefix, '');
			}

			/*
				Require Module Controller
			*/

			module.controllers.push({
				name: name,
				path: urlPath,
				location: stripped,
				subController: isSubController
			});

			/*
				Assign Controller Module routes to Express Instance
			*/

			//assignControllers(urlPath, module.controller);

		/*
			Check if file is a filter and assign it
		*/
		} else if(name === Options.mainFilter || endsWith(name, Options.filterPrefix)) {

			if(endsWith(name, Options.filterPrefix))
				urlPath = urlPath.replace(Options.filterPrefix, '');

			/*
				Require Module Filter
			*/

			module.filter = require(stripped);

			/*
				Assign Filter routes to Express Instance
			*/

			//addControllerFilter(urlPath, module.filter);

		}

	});

	return module;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function assignControllerActions(controller) {

	Utils.each(controller.actions, function(action) {
		
		var method = action.options.type,
			path = action.options.path,
			filter = action.options.filter,
			name = action.name,
			suffix = name === 'index' ? "" : name;

		var requestPath = path + "/" + suffix;

		if(suffix.length === 0 && path.length !== 0) {
			requestPath = path;
		}

		if(requestPath !== '/' && Utils.endsWith(requestPath, "/")) {
			requestPath = requestPath.substring(0, requestPath.length - 1);
		}

		var handler = function(req, res, next) {
			action.requestGlobals = {
				request: req,
				response: res,
				next: next
			};
			return action.options.action.apply(action, arguments);
		};

		if(filter) {
			addControllerFilter(path, filter, true);
		}

		console.info("Route assigned: Method %s, Path: %s", method, requestPath);

		app[method](requestPath, handler);

	});

}

function addControllerFilter(path, filter, explicit) {

	/*			
		Format: exports.filter = function() {}
	*/
	if(Utils.isFunction(filter)) {
		filter = {
			filter: filter,
			deny: '*',
			type: 'all'
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
		filter: defaultCallback,
		type: 'all'
	});

	/*
		Setup request filters on explicit path: 'controller'
	*/
	if(explicit) {
		addFilter(path, filter);
	}
	/*
		Setup request filters on paths: 'controller' and 'controller/*'
	*/
	else if(filter.deny === "*"){
		addFilter(path, filter);
		addFilter(path + "/*", filter);
	}

	/*
		Setup request filters on paths: 'controller/action' and 'controller/action1'
	*/
	else {
		var actions = filter.deny.split(",");

		Utils.each(actions, function(action) {
			action = action.trim();
			addFilter(path + "/" + action, filter);
		});
	}
	
}

function addFilter(route, filter) {

	var method = filter.type.toLowerCase();

	console.info("Filter assigned: Method %s, Path: %s", method, route);

	app[method](route, filter.filter);
}

function defaultCallback(req, res, next) {
	
	console.info("Route not handled, proceeding to next middleware.");
	
	return next();
}

exports.initialize = function(express, options) {

	if(Utils.isUndefined(express))
		throw new Error("You must pass an Express instance to bind Routes");

	console.time('Creating Modules');

	Utils.defaults(options, {
		dir: '../../routes',
		mainController: 'controller',
		controllerPrefix: 'Controller',
		viewFolderLocation: false,
		viewFolderName: 'views',
		mainFilter: 'filter',
		filterPrefix: 'Filter'
	});

	root = options.dir;
	app = express;
	Options = options;

	var modules = createModules(root);
	
	ModuleParser(modules);

	console.timeEnd('Creating Modules');
};

function ModuleParser(module) {
	controllers.parseControllers(module, Options, assignControllerActions);
}