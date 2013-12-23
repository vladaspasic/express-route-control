var router = require('./lib/router');

module.exports = function(app, options) {

	router.initialize(app, options.dir, options);

};