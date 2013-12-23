## express-route-control
=====================

Express Routes Controller, using simple file and folder structure.

This module takes care of your routes and can provide you with different formatting of your route controllers. You can use a plain function or an object defining your route options.

### Usage

In your app.js file you configure the router:

```javascript
var routes = require('express-route-control'),

...
..
.

routes(app, {
			 dir: __dirname + "/your_folder_location",
             rootFileName: 'some_name' // defaults to 'index'
       });
```

and a folder structure like this: 

```javascript
/your_folder_location/
	index.js
    other_route_name.js
    /parent_route_folder/
    	/child_route_folder/
        	index.js
    	index.js
```

This structure will create routes:

- `www.example.com`
- `www.example.com/other_route_name`
- `www.example.com/parent_route_folder`
- `www.example.com/parent_route_folder/child_route_folder`

If no `rootFileName` property is defined, `index` is considered as default. Index file takes care of the root path handling. 
For example if you have a route `'www.example.com'`, that file will handle the actions for those routes, if you have a route `'www.example.com/other_route_name'`, you must either have an action in your index.js file named `other_route_name`, or have a subdirectory named `other_route_name`.

With this approach you can easily maintain your code and separate your logic for different routes. In other words you can create modules.

Now to we are going to show you how to define handlers / controllers for each path.

In the `/your_folder_location/index.js`, create this function:

```javascript
exports.index = function(req, res) {
	...your logic
};
```

this function takes care of the `'www.example.com` path, if the same function is located in the `/your_folder_location/parent_route_folder/index.js`, will handle this route: `www.example.com/parent_route_folder`

You can also format this handler like this:

```javascript
exports.index = {
	type: 'get', // default type, you can pass 'post', 'update', 'delete, 'put'
	route: function(req, res) {
		...your logic
	}
};
```

or like this:

```javascript
exports.routes = {
	'index': {
		type: 'get',
		route: function(req, res) {
			...your logic
		}
	},
	'other_route': function() {
		...your logic
	}
};
```

As you can see all of these formats can create the same path handling, it can all depend on what do you need in this route.

## Route Options

### route

Type: ```Function``` Default: Returns next()

Function that takes care of the route handling, aka the Controllah.

### type

Type: ```String``` Default: ```get```

This value is what request method do you expect. It is not case sensitive, and it can be GET, POST, PUT, DELETE

### action

Type: ```String``` Default: to the name of the key/exported method

Defines the route name this controller should handle.

## Filters

You can also add a filter to each Controller file, which will be applied to all actions contained ot that controller path. Filter is defiined like this:

```javascript
 exports.filters = function(req, res, next) {
	if(req.session.user) next();
	res.send(403);
};
 ``` 
or with an deny parameter, witch specifically tells that this route, or routes, when hit must pass the filter:

```javascript
 exports.filters = {
	deny: "post, send",
	filter: function(req, res, next) {
		if(req.session.user) next();
		res.send(403);
	}
};
 ```

Each action can also contain a filter. You can define it like this:

```javascript
exports.index = {
	type: 'get',
	filter: function(req, res, next) {
		...your logic
	},
	route: function(req, res) {
	}
};
 ```




