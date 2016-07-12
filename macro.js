(function(){
/**
 * lib.js
 */

var _test = RegExp.prototype.test;
var isId = _test.bind(/[a..zA..Z_$][\w$]*/);

function keynames(obj, fit) {
  var keys = [], key;
  if (typeof fit === 'functiion') {
    for (key in obj)
      if (filter(key)) {
        keys.push(key);
      }
  }
  else {
    key = 0;
    for(keys[key] in obj) key++;
  }
  return keys;
}/**
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

/**
 * get.js
 */

/**
 * get(url) 获取URL指定的文本。
 *
 * @param {string} url
 * @return {string}
 */
function get(url) {
  var http = new XMLHttpRequest;
  http.open('GET', url, false);
  http.send();
  return http.status / 100 ^ 2 ? '' : http.responseText;
}
/**
 * lex.js
 */


/**
 * lex(code, lexis, where)
 *
 * @param {string} code
 * @param {RegExp} lexis
 * @param {boolean} [located=false]
 * @returns {function}
 */
function lex(code, lexis, located) {
  var ln, theSymbol, theIndex, lastIndex, l, c;
  ln = /[\n\u2028\u2029]|\r\n?/g;
  theIndex = lastIndex = l = c = 0;

  return function() {
    var Symbol, ms, s, t, w;

    if(lastIndex^theIndex) { //若有缓存的符号, 则先返回缓存的符号
      Symbol = theSymbol;
      s = Symbol.s;
      theIndex = lastIndex;
    }
    else {
      lexis.lastIndex = lastIndex;  //恢复状态
      if (ms = lexis.exec(code)) { //搜寻下一个词汇
        s = ms[0];                    //取词汇符号原文 s
        for (t = ms.length; ms[--t] === undefined;);   //计算词汇符号类型 t
        theIndex = ms.index;                 //记下词汇符号位置 i
        Symbol = {s: s, t: t, i: theIndex};      //形成词汇符号对象 Symbol
      }
      else {
        theIndex = code.length;
      }

      if (lastIndex ^ theIndex) {   //若解析开始位置与词汇符号未知不一致, 则中间有未知符号
        theSymbol = Symbol;                    //词汇符号应该缓存到下次读取
        s = code.substring(lastIndex, theIndex); //取未知符号原文 s
        Symbol = {s: s, t: 0, i: lastIndex};   //形成未知符号 Symbol
        lastIndex = lexis.lastIndex || theIndex;
      }
      else {
        lastIndex = theIndex = lexis.lastIndex;
      }
    }
    
    //下面计算符号在源代码中的行列位置:
    if(located && Symbol) {
      Symbol.l = l;     //设置符号的行为本次解析的行位置
      Symbol.c = c;     //设置符号的列为本次解析的列位置
      w = s.length;       //记录符号字符串长度
      c += w;  //默认下次解析的列号为原列号加上本次符号的长度
      while(ln.exec(s)) {             //若本次符号解析到换行
        l ++;                   //下次解析的行号+1
        c = w - ln.lastIndex;   //下次解析的列号就是符号原文最后一行的字符数
      }
    }
    return Symbol;
  };
}
/**
 * make.js
 */

//构造分解代码的正则式及词汇项类型常量:
var lexis = [];
function define(re) {
  return lexis.push('(' + re.source + ')')
};

var UNKNOWN = 0;
var INCLUDE_L = define(/ *\/\/#include!?\b.*(?:[\n\u2028\u2029]|\r\n?)?/);
var INCLUDE_B = define(/ *\/\*#include!?\b(?:[^*]|\*(?!\/))*\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
var DEFINE_L = define(/\/\/#define\b.*(?:[\n\u2028\u2029]|\r\n?)?/);
var DEFINE_B = define(/\/\*#define\b(?:[^*]|\*(?!\/))*\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
//var REGU_L = define( /\/\/#regu\b.*(?:[\n\u2028\u2029]|\r\n?)?/ );
//var REGU_B = define( /\/\*#regu\b(?:[^*]|\*(?!\/))*\*\/(?:[\n\u2028\u2029]|\r\n?)?/ );
var DENOTE = define(/ *\/\*\/\/\/?[^*]*\*\/.*/);
var DENOTE_D = define(/\/\*\{![^*]*\*\//);
var DENOTE_L = define(/\/\*\{[^*]*\*\//);
var DENOTE_R = define(/\/\*}[^*]*\*\//);
var COMMENT_L = define(/\/\/.*/);
var COMMENT_B = define(/\/\*[^*]*\*+(?:[^/][^*]*\*+)*\//);
var STRING_S = define(/'(?:[^'\\\n\r\u2028\u2029]|\\(?:.|[\n\u2028\u2029]|\r\n?))*(?:'|[\n\u2028\u2029]|\r\n?)/);
var STRING_D = define(/"(?:[^"\\\n\r\u2028\u2029]|\\(?:.|[\n\u2028\u2029]|\r\n?))*(?:"|[\n\u2028\u2029]|\r\n?)/);
var STRING_X = define(/`(?:[^`\\]|\\[\s\S])*`/);
var REGEX = define(/\/(?:\\.|\[(?:\\.|[^\]])*\]|[^\/\*\n\r])(?:\\.|\[(?:\\.|[^\]])*\]|[^/\n\r])*?\/[gimy]*/);
var CURL_L = define(/{/);
var CURL_R = define(/}/);

lexis = RegExp(lexis.join('|'), 'g');

function make(url, included, defined, indent) {
  included || ( included = Object.create(null) );
  defined || ( defined = Object.create(null) );
  indent || ( indent = '' );

  if (included[url]) {
    var code = '';
  }
  else {
    included[url] = 1;
    code = get(url);
    code = makeCode(code, url, included, defined, indent);
  }
  return code;
}

/**
 *
 * @param code
 * @param url
 * @param included
 * @param defined
 * @param indent
 * @returns {string}
 */
function makeCode(code, url, included, defined, indent) {
  included || ( included = Object.create(null) );
  defined || ( defined = Object.create(null) );
  indent || ( indent = '' );

  var read = lex(code, lexis), item, denoted = 0;

  code = [];
  while (item = read()) {
    var s = item.s;
    var t = item.t;
    if (denoted == 1) {   //注释跳过状态:
      if (t == DENOTE_R) {    //遇到注释结束符, 追加一个 "*/"
        denoted = 0;
        code.push('*/');
      }
      else if (t != COMMENT_B) {  //其他符号原样送回
        code.push(indentLF(s, indent));
      }
    }
    else if (denoted == 2) {  //注释删除状态:
      if (t == DENOTE_R) {
        denoted = 0;
      }
    }
    else {  //正常解析状态:
      if (t == INCLUDE_L || t == INCLUDE_B) {
        s = makeInclude(s, url, included, defined, indent);
      }
      else if (t == DEFINE_L || t == DEFINE_B) {
        makeDefine(s, url, included, defined);
        s = '';
      }
      // else if (t == REGU_L || t == REGU_B) {
      //   makeRegu(s, defined);
      //   s = '';
      // }
      else if (t == CURL_L) {        //遇到"{"将创建子作用域的状态:
        included = Object.create(included);
        defined = Object.create(defined);
      }
      else if (t == CURL_R) {   //遇到"}"将释放子作用域状态:
        if (t = Object.getPrototypeOf(included)) {
          included = t;
        }
        if (t = Object.getPrototypeOf(defined)) {
          defined = t;
        }
      }
      else if (t == DENOTE) {
        s = makeDenote(s);
        s = indentLF(s);
      }
      else if (t == DENOTE_L) {
        denoted = 1;
        s = '/*';
      }
      else if (t == DENOTE_D) {
        denoted = 2;
        s = '/*';
      }
      else if (t == REGEX) {
        s = makeRegexp(s, defined);
        s = indentLF(s, indent);
      }
      else if (t == UNKNOWN) {
        s = makeUnknown(s, defined);
        s = indentLF(s, indent);
      }
      else if (t == COMMENT_B) {
        s = indentLF(s, indent);
      }
      code.push(s);
    }
  }
  return code.join('');
}

/**
 * makeInclude(code, rel, included)
 *
 */
var reInclude = /( *)\/[*/]#include(!?)\s*(\S+)/;
function makeInclude(code, url, included, defined, indent) {
  var ms = code.match(reInclude);
  if (ms) {
    indent = indent + ms[1];
    url = purl(ms[3], url);
    if (ms[2]) {
      code = make(url, {}, defined, indent);
    }
    else {
      code = make(url, included, defined, indent);
    }
    code = indent + code;
  }
  return code;
}


/**
 * makeDefine(code, defined)
 */
var reDefine = /\/\/#define\s*(\w+)\s*(?:\s*\(\s*([^)]*)\))?\s*(.*)|\/\*#define\s*(\w+)\s*(?:\s*\(\s*([^)]*)\))?\s*((?:[^*]|\*(?!\/))*)/;
function makeDefine(code, url, included, defined) {
  var ms = code.match(reDefine);
  if (ms) {
    var name = ms[1] || ms[4], args = ms[2] || ms[5], body = (ms[3] || ms[6]).trim();
    if (body) {
      body = makeCode(body, url, included, defined);
      var macro = {s: body};
      if (args) {
        macro.p = RegExp(args.replace(/(\w+)/g, '(\\b$1\\b)').replace(/\s*,\s*/g, '|'), 'g');
      }
      defined[name] = macro;
      name = keynames(defined, isId);
      defined[0] = RegExp('\\b(' + name.join('|') + ')\\b(?:\\s*\\(([^)]*)\\))?', 'g');
    }
  }
}

/**
 * makeDenote(code)
 */
var reDenote = /( *)\/\*\s*\/\/(!?)[^*]*\*\/(.*)/;

/*#defined b /(?:\s*)/ */
function makeDenote(code) {
  var ms = code.match(reDenote);
  if (ms[2]) {
    code = '';
  }
  else {
    code = ms[1] + '//' + ms[3];
  }
  return code;
}

/**
 * makeRegexp(code, defined)
 *    替换正则表达式中的宏
 *
 * @param code
 * @param defined
 * @returns {string}
 */
var reRegu = /<([a-zA-Z_$][$\w]*)>/g;
function makeRegexp(code, defined) {
  return code.replace(reRegu, function (s, name) {
    var macro, re, i;
    if (macro = defined[name]) {
      re = macro.s;
      if (re[0] == '/' && (i = re.lastIndexOf('/')) > 1) {
        s = re.substring(1, i);
      }
    }
    return s;
  });
}

/**
 * makeUnknown(code, defined)
 */
function makeUnknown(code, defined) {
  var re = defined[0];

  return re ?
    code.replace(re, function (s, name, param) {
      var macro;
      if (macro = defined[name]) {
        if (macro.p && param) {
          param = param.split(/\s*,\s*/);
          s = macro.s.replace(macro.p, function (p) {
            var args = arguments, len = args.length - 2, i;
            for (i = 1; i < len; i++) {
              if (args[i]) {
                p = param[i - 1];
                break;
              }
            }
            return p;
          });
        }
        else {
          s = macro.s;
        }
      }
      return s;
    })
    : code;
}

/**
 * indentLF(code, indent)
 */
function indentLF(code, indent) {
  return code.replace(/\n+/g, '$&' + indent);
}/**
 * main.js
 */

var home = purl(location.toString());

var script = document.scripts;
script = script[script.length - 1];
var reUrls = /\s*[,;]\s*|^\s*|\s*$/;
var hasCode = reUrls.test.bind(/\S/);

var fixes = [], urls, url, i, code;

if (urls = script.getAttribute('fix')) {
  urls = urls.split(reUrls);
  for (i = 0; i < urls.length; i++)
    if (url = urls[i]) {
      url = purl(url, home);
      code = make(url);
      code += '\n//# sourceURL=' + url;
      fix = window.eval(code);
      if (typeof fix == 'function') {
        fixes.push(fix);
      }
    }
}

if (script.hasAttribute('macro')) {
  urls = script.getAttribute('macro').split(reUrls);
  for (i = 0; i < urls.length; i++)
    if (url = urls[i]) {
      url = purl(url, home);
      code = make(url);
      code = fixing(code);
      code += '\n//# sourceURL=' + url;
      window.eval(code);
    }
  code = makeCode(script.text);
  code = fixing(code);
  if (url = script.getAttribute('name')) {
    code += '\n//# sourceURL=' + purl(url, home + '/');
  }
  window.eval(code);
}

function fixing(code) {
  var i, fix;
  for(i=0; i<fixes.length; i++) {
    fix = fixes[i];
    fix = fix(code);
    if(hasCode(fix)) {
      code = fix;
    }
  }
  return code;
}

})();
