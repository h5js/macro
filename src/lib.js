/**
 * lib.js
 */

var _call = Function.prototype.call;
var _bind = Function.prototype.bind;
var _test = RegExp.prototype.test;


/**
 * func(method)
 *    将方法转换为函数。若fn = func(method), 则 obj.method(...) 等价于 fn(obj, ...)
 */
var func = _call.bind(_bind, _call);

var isId = _test.bind(/^[a-zA-Z_$][\w$]*$/);

function keynames(obj, fit) {
  var keys = [], key;
  if (typeof fit === 'function') {
    for (key in obj)
      if (fit(key)) {
        keys.push(key);
      }
  }
  else {
    key = 0;
    for(keys[key] in obj) key++;
  }
  return keys;
}