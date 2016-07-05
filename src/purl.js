/**
 * purl.js
 */

/**
 * normalize(path)
 *    对路径进行规划化处理, 尽可能消除相对路径. 返回规格化后的路径.
 */
var normalize = function (src) {
  var des = [], len, top;
  src = src.split(this);
  for (var i=0; i< src.length; i++) {
    var sym = src[i];
    if (len = des.length) {
      if (sym != '.') {
        top = des[len-1];
        if (sym != '..') {
          if(top == '.' && sym)
            des.pop();
          des.push(sym);
        }
        else if (top) {
          if (top == '..') {
            des.push(sym);
          }
          else {
            des.pop();
          }
        }
      }
    }
    else {
      des.push(sym);
    }
  }
  return des.join('/');
}.bind(
  /\/+/   //reSplit
);

var purl = function(url, rel) {
  var ms = url.match(this);
  var origin = ms[1];
  var dir = ms[2];
  var file = ms[3];

  if ( ! origin ) {  //若没有origin, 则是相对的URL
    if(rel){
      ms = rel.match(this);
      origin = ms[1];

      if ( dir[0] != "/" )   //相对目录
        dir = ms[2] + dir;
    }
  }
  dir = normalize(dir);

  return origin + dir + file;

}.bind(
  /^(https?:\/\/[\w-]+(?:\.[\w-]+)*(?::\d+)?(?=\/)|)(\/?(?:(?:[\w-]+(?:\.[\w-]+)*|\.\.?)\/)*|)([\w-]+(?:\.[\w-]+)*|)(\?[^#]*|)(#.*|)/
  //|1:origin                                      ||2:dir                                   ||3:file             ||4:search|5:hash
);

