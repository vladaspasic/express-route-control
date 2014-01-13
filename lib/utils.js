var ArrayProto = Array.prototype,
    ObjProto = Object.prototype,
    FuncProto = Function.prototype,
    nativeForEach = ArrayProto.forEach,
    nativeKeys = Object.keys,
    slice = ArrayProto.slice,
	hasOwnProperty = ObjProto.hasOwnProperty,
	breaker = {};

var Utils = {};

var each = Utils.each = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (var i = 0, length = obj.length; i < length; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
        }
    } else {
        var keys = Utils.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
        }
    }
};

var keys = Utils.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj)
        if (Utils.has(obj, key)) keys.push(key);
    return keys;
};

var has = Utils.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
};

 var extend = Utils.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
};

var defaults = Utils.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
};

var isObject = Utils.isObject = function(obj) {
	return obj === Object(obj);
};

var isFunction = Utils.isFunction = function(obj) {
	return typeof obj === 'function';
};

var isUndefined = Utils.isUndefined = function(obj) {
	return obj === void 0;
};

var endsWith = Utils.endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

var replaceIfEnds = Utils.replaceIfEnds = function(str, suffix, replace) {
    var endsWith = Utils.endsWith(str, suffix);
    
    if(endsWith)
        return str.replace(suffix, replace);
        
    return str;
};

var defaultCallback = Utils.defaultCallback = function(req, res, next) {
    
    console.info("Route not handled, proceeding to next middleware.");
    
    return next();
};

module.exports = Utils;