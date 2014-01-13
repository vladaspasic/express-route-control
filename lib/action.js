var Utils = require('./utils');

var Action = function(controller, options) {
	this.options = options;
	this.name = options.name;
	this.controller = controller;
};

Action.prototype = {
	_getHandler: function() {
		return function(req, res, next) {
			this.requestGlobals = {
				request: req,
				response: res,
				next: next
			};
			this.options.route.apply(this, arguments);
		};
	},
	render: function(json) {
		this.renderPage(this.name, json);
	},
	renderPage: function(page, json) {
		if(this.requestGlobals.request.xhr) {
			this.renderJSON(json);
		}

		var view = this.controller.getView(page);

		this.requestGlobals.response.render(view, json);
	},
	renderJSON: function(json) {
		this.requestGlobals.response.send(json);
	}
};

var create = function(controller, options) {

	if(!options.name)
		throw new Error("No name defined for this action.");

	Utils.defaults(options, {
		path: controller.root,
		type: 'get',
		filter: false,
		action: options.route || options.action || Utils.defaultCallback
	});

	var action = new Action(controller, options);

	controller.registerAction(options.name, action);

	return action;
};

var createActions = function(actions, controller) {

	Utils.each(actions, function(action, name) {

		if(Utils.isFunction(action)) {

			/*			
				Format: exports.action = function() {}
			*/
			create(controller, {
				name: name,
				action: action
			});

		} else if(Utils.has(action, 'route')) {

			/*
				Format: exports.action = {
					route: function() {},
					...,
					..,
					.
				}	
			*/
			create(controller, Utils.extend(action, {
				name: name
			}));
		} else if(Utils.isObject(action)) {

			/*
				Format: exports.actions = {
					'action1': {
						route: function()
					},
					'action2': {
						route: function()
					}
					...,
					..,
					.
				}
			*/
			createActions(action, controller);
		}

	});

};

exports.create = create;

exports.createActions = createActions;