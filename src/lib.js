/**
 * lib.js
 */

var _test = RegExp.prototype.test;
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