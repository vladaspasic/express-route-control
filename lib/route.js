module.exports = function(route) {
	return new Route(route);
};

var Route = function(route) {
	this.route = route;
};

Route.prototype = {
	handleRequest: function(req, res, next) {
		this.req = req;
		this.res = res;
		this.next = next;
		this.filter.call(this, req, res, this.getRoute());
	},
	filter: function(req, res, next) {
		var ctx = this,
			args = arguments,
			filter = this.getFilter();

		if(!filter)
			return next.apply(ctx, args);

		filter.call(this, req, res, function() {
			return next.apply(ctx, args);
		});
	},
	render: function(json) {
		var page = this.getPath().substring(1) + "/" + this.getAction();
		this.renderPage(page, json);
	},
	renderPage: function(page, json) {

		if(this.req.xhr) {
			res.send(json);
		}

		this.res.render(page, json);
	},
	renderJSON: function(json) {
		this.res.send(json);
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