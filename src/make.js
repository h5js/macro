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
    var macro, re, i;
    if (macro = context.defined[name]) {
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
}