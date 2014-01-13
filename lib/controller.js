var actions = require('./action'),
	Utils = require('./utils');

var Controller = function(options) {
	this.options = options;
	this.root = this.options.root;
	this.actions = {};
};

Controller.prototype = {
	handleRouteAction: function() {

	},
	registerAction: function(name, action) {

		this.actions[name] = action;

		return action;
	},
	getActions: function() {
		return this.actions;
	},
	getAction: function(name) {
		return this.actions[name];
	},
	getView: function(view) {
		var folder = this.options.views;

		return folder + "/" + view;
	}
};

var create = function(controller, configuration, module) {
	var defaults = {};

	var file = require(controller.location);
		
	var ctrlOptions = file.options || false;
	var filters = file.filters || false;
	var viewsFolder = module.views;

	if(controller.subController)
		viewsFolder += "/" + controller.name;

	if(ctrlOptions) {
		delete file.options;
	}

	if(filters) {
		delete file.filters;
	}
	
	var options = Utils.extend(defaults, {
		name: controller.name,
		root: Utils.replaceIfEnds(controller.path, configuration.mainController, ""),
		views: viewsFolder,
		filters: filters,
		file: controller.location
	}, ctrlOptions);

	var instance = new Controller(options);

	actions.createActions(file, instance);

	return instance;
};

exports.create = create;

var parseControllers = function(module, configuration, callback) {

	Utils.each(module.controllers, function(controller, key) {

		controller.instance = create(controller, configuration, module);

		callback && callback(controller.instance, controller, module);

	});

	Utils.each(module.children, function(child) {
		parseControllers(child, configuration, callback);
	});

};

exports.parseControllers = parseControllers;