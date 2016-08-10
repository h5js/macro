(function(){
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
}/**
 * Eval(env)
 *    创建指定环境的 eval 函数。
 */

var Eval = func((0,eval)(
  //@formatter:off
    '(function(){'+
      'with(this){'+          //饱受争议的with语句（ECA7仍然支持with语句，至少5年内没问题）
        'return function(){'+
          '"use strict";'+
          'return eval([].pop.call(arguments))'+  //邪恶函数eval(), 清空参数以策安全
        '}'+
      '}'+
    '})'
    //@formatter:on
));/**
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
        //s = ms[0];                    //取词汇符号原文 s
        for (t = ms.length; ms[--t] === undefined;);   //计算词汇符号类型 t
        s = ms[t];
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
function def(re) {
  return lexis.push(re.source)
};

var UNKNOWN = 0;
var INCLUDE_L = def(/( *\/\/#include\b.*(?:[\n\u2028\u2029]|\r\n?)?)/);
var INCLUDE_B = def(/ *\/\*#include\b((?:[^*]|\*(?!\/))*)\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
var DEFINE_L = def(/[ \t]*\/\/#((?:define|var)\b.*)(?:[\n\u2028\u2029]|\r\n?)?/);
var DEFINE_B = def(/[ \t]*\/\*#((?:define|var)\b(?:[^*]|\*(?!\/))*)\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
var RUN_L = def(/[ \t]*\/\/#({.*)(?:[\n\u2028\u2029]|\r\n?)?/);
var RUN_B = def(/[ \t]*\/\*#({(?:[^*]|\*(?!\/))*)\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
var IF_L = def(/ *\/\/#if\b(.*)(?:[\n\u2028\u2029]|\r\n?)?/);
var IF_B = def(/ *\/\*#if\b((?:[^*]|\*(?!\/))*)\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
var ELSE_IF_L = def(/ *\/\/#}\s*else\s+if\b(.*)(?:[\n\u2028\u2029]|\r\n?)?/);
var ELSE_IF_B = def(/ *\/\*#}\s*else\s+if\b((?:[^*]|\*(?!\/))*)\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
var ELSE_L = def(/ *\/\/#}\s*else\b(.*)(?:[\n\u2028\u2029]|\r\n?)?/);
var ELSE_B = def(/ *\/\*#}\s*else\b((?:[^*]|\*(?!\/))*)\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
var END_L = def(/ *(\/\/#}.*)(?:[\n\u2028\u2029]|\r\n?)?/);
var END_B = def(/ *(\/\*#}(?:[^*]|\*(?!\/))*)\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
var COMMENT_L = def(/(\/\/.*)/);
var COMMENT_B = def(/(\/\*[^*]*\*+(?:[^/][^*]*\*+)*\/)/);
var STRING_S = def(/('(?:[^'\\\n\r\u2028\u2029]|\\(?:.|[\n\u2028\u2029]|\r\n?))*(?:'|[\n\u2028\u2029]|\r\n?))/);
var STRING_D = def(/("(?:[^"\\\n\r\u2028\u2029]|\\(?:.|[\n\u2028\u2029]|\r\n?))*(?:"|[\n\u2028\u2029]|\r\n?))/);
var STRING_X = def(/(`(?:[^`\\]|\\[\s\S])*`)/);
var NONREG = def(/((?:\b|[\])])\s*\/(?![\/*]))/);
var REGEX = def(/(\/(?:\\.|\[(?:\\.|[^\]])*\]|[^\/\*\n\r])(?:\\.|\[(?:\\.|[^\]])*\]|[^/\n\r])*?\/[gimy]*)/);
var CURL_L = def(/({)/);
var CURL_R = def(/(})/);

lexis = RegExp(lexis.join('|'), 'g');

function Context(parent) {
  var context = Object.create(parent || null);
  context.included = Object.create(parent && parent.included || null);
  context.defined = Object.create(parent && parent.defined || null);
  context.variables = Object.create(parent && parent.variables || null);
  context.exec = Eval(context.variables);
  return context;
}

function make(context, url, indent) {
  if (context.included[url]) {
    var code = '';
  }
  else {
    context.included[url] = 1;
    code = get(url);
    code = makeCode(context, code, url, indent);
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
function makeCode(context, code, url, indent) {
  var skips=[], skip=0;
  if (indent == undefined) indent = '';

  var read = lex(code, lexis), item, denoted = 0;

  code = [];
  while (item = read()) {
    var t = item.t;
    var s = item.s;

    if(t == IF_L || t == IF_B) {
      skips.push(skip);
      skip = skip || makeCondition(context, s);
      s = '';
    }
    else if(t == ELSE_L || t == ELSE_B) {
      skip = !skip || skips[skips.length-1];
      s = '';
    }
    else if(t == ELSE_IF_L || t == ELSE_IF_B) {
      skip = skips[skips.length-1] || makeCondition(context, s);
      s = '';
    }
    else if(t == END_L || t == END_B) {
      skip = skips.pop();
      s = '';
    }
    else if(skip){
      s = '';
    }
    else {
      if (t == INCLUDE_L || t == INCLUDE_B) {
        s = makeInclude(context, s, url, indent);
      }
      else if (t == DEFINE_L || t == DEFINE_B) {
        makeDefine(context, s, url);
        s = '';
      }
      else if (t == RUN_L || t == RUN_B) {
        makeRun(context, s);
        s = '';
      }
      else if (t == CURL_L) {        //遇到"{"将创建子作用域的状态:
        context = Context(context);
      }
      else if (t == CURL_R) {   //遇到"}"将释放子作用域状态:
        if (t = Object.getPrototypeOf(context)) {
          context = t;
        }
      }
      else if (t == REGEX) {
        s = makeRegexp(context, s);
        s = indentLF(s, indent);
      }
      else if (t == UNKNOWN) {
        s = makeUnknown(context, s);
        s = indentLF(s, indent);
      }
      else if (t == COMMENT_B) {
        s = indentLF(s, indent);
      }
    }
    if(s) {
      code.push(s);
    }
  }
  return code.join('');
}

/**
 * makeCondition(context, s)
 */
var reCondition = /\(([^)]+)\)\s*\{/;
function makeCondition(context, code) {
  var skip, ms = code.match(reCondition);
  if( ms ) {
    try{
      skip = !context.exec(ms[1]);
    }
    catch(e) {
      skip = 1;
    }
  }
  return skip;
}

/**
 * makeInclude(code, rel, context)
 *
 */
var reInclude = /( *)\/[*/]#include\s*(\S+)/;
function makeInclude(context, code, url, indent) {
  var ms = code.match(reInclude);
  if (ms) {
    indent = indent + ms[1];
    url = purl(ms[2], url);
    code = make(context, url, indent);
    code = indent + code;
  }
  return code;
}


/**
 * makeDefine(code, defined)
 */
var reDefine = /(define|var)\s+(\w+)\s*(?:(=\s*(?:[^\0]|\0)*)|(?:\(\s*([^)]*)\)\s*)?((?:[^\0]|\0)*))/;
function makeDefine(context, code) {
  var ms = code.match(reDefine);
  if (ms) {
    var directive = ms[1], name = ms[2], code = ms[3], args = ms[4], body = ms[5];
    if (code) {
      context.variables[name] = undefined;
      body = context.exec(name+' '+code);
      if(body instanceof RegExp) {
        body = makeRegexp(context, String(body));
      }
      context.variables[name] = body;
      body = String(body);
    }
    if ((directive === 'define') && body) {
      var macro = {s: body};
      if (args) {
        macro.p = RegExp(args.replace(/(\w+)/g, '(\\b$1\\b)').replace(/\s*,\s*/g, '|'), 'g');
      }
      context.defined[name] = macro;
      name = keynames(context.defined, isId);
      context.re = RegExp('\\b(' + name.join('|') + ')\\b(?:\\s*\\(([^)]*)\\))?', 'g');
    }
  }
}


/***
 * makeRun(context, s)
 */
function makeRun(context, s) {
  var j = s.lastIndexOf('}');
  if(j<1) {
    j = s.length;
  }
  s = s.slice(1, j);
  context.exec(s);
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
function makeRegexp(context, code) {
  return code.replace(reRegu, function (s, name) {
    var re, i;
    if (re = String(context.variables[name])) {
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
function makeUnknown(context, code) {
  var re = context.re;

  return re ?
    code.replace(re, function (s, name, param) {
      var macro;
      if (macro = context.defined[name]) {
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
        s += '/*' + name + '*/';
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
      code = get(url);
      code += '\n//# sourceURL=' + url;
      fix = window.eval(code);
      if (typeof fix == 'function') {
        fixes.push(fix);
      }
    }
}

var context = Context();

if(urls = script.getAttribute('macro')) {
  urls = script.getAttribute('macro').split(reUrls);
  for (i = 0; i < urls.length; i++)
    if (url = urls[i]) {
      url = purl(url, home);
      code = make(context, url);
      code = fixing(code);
      code = '"use strict";\n' + code + '\n//# sourceURL=' + url;
      window.eval(code);
    }
}

code = script.text;
var run = /^\s*\/\/#run\b/.test(code);

code = makeCode(context, code, home);
code = fixing(code);
script.text = code;

if(run) {
  if (url = script.getAttribute('name')) {
    code = '"use strict";\n' + code + '\n//# sourceURL=' + purl(url, home + '/');
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
