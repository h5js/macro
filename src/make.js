/**
 * make.js
 */

//构造分解代码的正则式及词汇项类型常量:
var lexis = [];
function define(re) { return lexis.push('(' + re.source + ')') };

var UNKNOWN = 0;
var INCLUDE_L = define( / *\/\/#include!?\b.*(?:[\n\u2028\u2029]|\r\n?)?/ );
var INCLUDE_B = define( / *\/\*#include!?\b(?:[^*]|\*(?!\/))*\*\/(?:[\n\u2028\u2029]|\r\n?)?/ );
var DEFINE_L = define( /\/\/#define\b.*(?:[\n\u2028\u2029]|\r\n?)?/ );
var DEFINE_B = define( /\/\*#define\b(?:[^*]|\*(?!\/))*\*\/(?:[\n\u2028\u2029]|\r\n?)?/ );
//var REGU_L = define( /\/\/#regu\b.*(?:[\n\u2028\u2029]|\r\n?)?/ );
//var REGU_B = define( /\/\*#regu\b(?:[^*]|\*(?!\/))*\*\/(?:[\n\u2028\u2029]|\r\n?)?/ );
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
 * makeRegexp(code, defined)
 *    替换正则表达式中的宏
 *
 * @param code
 * @param defined
 * @returns {string}
 */
var reRegexpMarco = /<(\w+)>/g;
function makeRegexp(code, defined) {
  return code;
}

/**
 * makeUnknown(code, defined)
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
}