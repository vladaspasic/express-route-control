module.exports = function(route) {
	return new Route(route);
};

var Route = function(route) {
	this.route = route;
};

Route.prototype = {
	handleRequest: function(req, res, next) {
		this.filter.call(this, req, res, this.getRoute());
	},
	filter: function(req, res, next) {
		var action = this.getControllerAction(),
			args = arguments,
			filter = this.getFilter();

		action.requestGlobals = {
			request: req,
			response: res,
			next: next,
		};

		if(!filter)
			return next.apply(action, args);

		filter.call(this, req, res, function() {
			return next.apply(action, args);
		});
	},
	getType: function() {
		return this.route.type.toLowerCase();
	},
	getPath: function() {
		return this.route.path;
	},
	getAction: function() {
		return this.route.action;
	},
	getRoute: function() {
		return this.route.route;
	},
	getControllerAction: function() {
		var ctrl = this.route.controller;

		var action = ctrl.getAction(this.getFullPath());

		return action;
	},
	getFilter: function() {
		return this.route.filter;
	},
	getFullPath: function() {
		var path = this.getPath(), action = this.getAction();

		var suffix = resolveSuffixPath(action);

		var newPath = path + "/" + suffix;

		if(suffix.length === 0 && path.length !== 0) {
			newPath = path;
		}

		return newPath;
	}
};

function resolveSuffixPath(name) {
	return name === 'index' ? "" : name;
}