(function(){
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
  return function(code, lexis) {
    var $, ms, s, t, i, ln, w;

    if(lexis.$) { //若有缓存的符号, 则先返回缓存的符号
      $ = lexis.$;
      lexis.$ = 0;
      s = $.s;
    }
    else if( ms = lexis.exec(code)) { //搜寻下一个词汇
      s = ms[0];                    //取词汇符号原文 s
      for(t=ms.length;!ms[--t];);   //计算词汇符号类型 t
      i = ms.index;                 //记下词汇符号位置 i
      $ = {s: s, t: t, i: i };      //形成词汇符号对象 $

      if(lexis.i ^ i) {   //若解析开始位置与词汇符号未知不一致, 则中间有未知符号
        lexis.$ = $;                    //词汇符号应该缓存到下次读取
        s = code.substring(lexis.i, i); //取未知符号原文 s
        $ = {s: s, t: 0, i: lexis.i|0};   //形成未知符号 $
      }
      lexis.i = lexis.lastIndex;
    }
    else {  //若搜寻结束后解析尾部
      i = code.length;  //记下结束位置;
      if(lexis.i ^ i) {  //若解析开始位置与结束位置不一致, 则尾部是未知符号
        s = code.substring(lexis.i);      //取未知符号原文 s
        $ = {s: s, t: 0, i: lexis.i|0};   //形成未知符号 $
        lexis.i = lexis.lastIndex = i;    //下次从结束位值开始, 确保下次解析结束
      }
      else {
        lexis.i = 0;  //解析结束, 但设置lexis为0可让解析器开始新的一轮循环
      }
    }

    //下面计算符号在源代码中的行列位置:
    if(located && $) {
      ln = this;          //换行符正则式
      $.l |= lexis.l;     //设置符号的行为本次解析的行位置
      $.c |= lexis.c;     //设置符号的列为本次解析的列位置
      w = s.length;       //记录符号字符串长度
      lexis.l = $.l;      //默认下次解析的行号不变
      lexis.c = $.c + w;  //默认下次解析的列号为原列号加上本次符号的长度
      while(ln.exec(s)) {             //若本次符号解析到换行
        lexis.l ++;                   //下次解析的行号+1
        lexis.c = w - ln.lastIndex;   //下次解析的列号就是符号原文最后一行的字符数
      }
    }

    return $;

  }.bind(/\n/g, code, lexis);
}
/**
 * make.js
 */

//构造分解代码的正则式及词汇项类型常量:
var lexis = [];
function define(re) { return lexis.push('(' + re.source + ')') };

var UNKNOWN = 0;
var INCLUDE_L = define( / *\/\/#include!?\b.*/ );
var INCLUDE_B = define( / *\/\*#include!?\b(?:[^*]|\*(?!\/))*\*\// );
var DEFINE_L = define( /\/\/#define\b.*(?:[\n\u2028\u2029]|\r\n?)?/ );
var DEFINE_B = define( /\/\*#define\b(?:[^*]|\*(?!\/))*\*\/(?:[\n\u2028\u2029]|\r\n?)?/ );
var DENOTE = define( / *\/\*\/\/\/?[^*]*\*\/.*/ );
var DENOTE_D = define( /\/\*\{![^*]*\*\// );
var DENOTE_L = define( /\/\*\{[^*]*\*\// );
var DENOTE_R = define( /\/\*}[^*]*\*\// );
var COMMENT_L = define( /\/\/.*/ );
var COMMENT_B = define( /\/\*[^*]*\*+(?:[^/][^*]*\*+)*\// );
var STRING_S = define( /'(?:[^'\\\n\r\u2028\u2029]|\\(?:.|[\n\u2028\u2029]|\r\n?))*(?:'|[\n\u2028\u2029]|\r\n?)/ );
var STRING_D = define( /"(?:[^"\\\n\r\u2028\u2029]|\\(?:.|[\n\u2028\u2029]|\r\n?))*(?:"|[\n\u2028\u2029]|\r\n?)/ );
var STRING_X = define( /`(?:[^`\\]|\\[\s\S])*`/ );
var REGEX = define( /\/(?:\\.|\[(?:\\.|[^\]])*\]|[^\/\*\n\r])(?:\\.|\[(?:\\.|[^\]])*\]|[^/\n\r])*?\/[gimy]*/ );
var CURL_L = define( /{/ );
var CURL_R = define( /}/ );

lexis = RegExp(lexis.join('|'), 'g');

function make(url, included, defined, indent) {
  included  || ( included = Object.create(null) );
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
  included  || ( included = Object.create(null) );
  defined || ( defined = Object.create(null) );
  indent || ( indent = '' );

  var read = lex(code, lexis), item, denoted = 0;

  code = [];
  while (item = read()) {
    var s = item.s;
    var t = item.t;
    if (denoted == 1) {
      if (t == DENOTE_R) {
        denoted = 0;
        code.push('*/');
      }
      else if (t != COMMENT_B) {
        code.push(indentLF(s, indent));
      }
    }
    else if (denoted == 2) {
      if (t == DENOTE_R) {
        denoted = 0;
      }
    }
    else {
      if (t == INCLUDE_L || t == INCLUDE_B) {
        s = makeInclude(s, url, included, defined, indent);
      }
      else if (t == DEFINE_L || t == DEFINE_B) {
        makeDefine(s, defined);
        s = '';
      }
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
var reDefine = /\/[*/]#define\s*(\w+)\s*(?:\(\s*([^)]*)\s*\))?\s*((?:[^*]|\*(?!\/))*)/;
function makeDefine(code, defined) {
  var ms = code.match(reDefine);
  if (ms) {
    var name = ms[1], args = ms[2], body = ms[3].trim();
    if (body) {
      var macro = {s: body};
      var re = '\\b' + name + '\\b';
      if (args) {
        re += '\\s*\\([^\\)]*\\)';
        macro.p = RegExp(args.replace(/(\w+)/g, '(\\b$1\\b)').replace(/\s*,\s*/g, '|'), 'g');
      }
      macro.r = '(' + re + ')';
      defined['$' + name] = macro;
      re = [];
      for (name in defined) {
        if (name[0] == '$') {
          macro = defined[name];
          re.push(macro.r);
          defined[re.length] = macro;
        }
      }
      defined[0] = RegExp(re.join('|'), 'g');
    }
  }
}

/**
 * makeDenote(code)
 */
var reDenote = /( *)\/\*\s*\/\/(!?)[^*]*\*\/(.*)/;
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
 * makeCode(code, defined)
 */
var reParams = /\(\s*([^\)]*)\s*\)/;
function makeUnknown(code, defined) {
  var re = defined[0];
  if (re) {
    code = code.replace(defined[0], function (s) {
      var args = arguments, len = args.length - 2;
      for (var i = 1; i < len; i++) {
        if (args[i]) {
          var macro = defined[i];
          if (macro.p) {
            if (s = s.match(reParams)) {
              s = s[1].split(/\s*,\s*/);
              s = macro.s.replace(macro.p, function (p) {
                var args = arguments, len = args.length - 2, i;
                for (i = 1; i < len; i++) {
                  if (args[i]) {
                    p = s[i - 1];
                    break;
                  }
                }
                return p;
              });
            }
          }
          else {
            s = macro.s;
          }
          break;
        }
      }
      return s;
    });
  }
  return code;
}

/**
 * indentLF(code, indent)
 */
function indentLF(code, indent){
  return code.replace(/\n+/g, '$&'+indent);
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
