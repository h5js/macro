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
var DEFINE_L = define(/[ \t]*\/\/#define\b.*(?:[\n\u2028\u2029]|\r\n?)?/);
var DEFINE_B = define(/[ \t]*\/\*#define\b(?:[^*]|\*(?!\/))*\*\/(?:[\n\u2028\u2029]|\r\n?)?/);
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
    code = makeCode(code, url, included, defined, indent, 1);
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
function makeCode(code, url, included, defined, indent, commented) {
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
        s = makeUnknown(s, defined, commented);
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
    var name = ms[1] || ms[4], args = ms[2] || ms[5], body = ms[3] || ms[6];
    if (body) {
      body = makeCode(body.trim(), url, included, defined);
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
function makeUnknown(code, defined, commented) {
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
        if(commented) {
          s += '/*'+name+'*/';
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
}