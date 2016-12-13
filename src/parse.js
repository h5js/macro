// parse.js ----------------------------------------------------------------------------------------

// parse = Parse(grammar)
var Parse = function () {
  var reInit = /((#?)([a-zA-Z]\w*)(?:\[([a-zA-Z]\w*(?:,[a-zA-Z]\w*)*)])?([?+*]?)(?:~([a-zA-Z]\w*))?\s*:)|((?:[a-zA-Z]\w*(?:\[[?+-][a-zA-Z]\w*(?:,[?+-][a-zA-Z]\w*)*\])?|\/(?:\\.|\[(?:\\.|[^\]])*]|[^\/*\n\r])(?:\\.|\[(?:\\.|[^\]])*]|[^\/\n\r])*?\/)[?+*]?(?:~[A-Za-z]\w*)?)|((?:\[([+-])([a-zA-Z]\w*)\])|\n(?:\s*\n)*|\||;.*)|(\S+)/g;
  /* regInit 由以下代码生成
   console.log(function(){for(var s='',i=0,a;(a=arguments[i++])&&(s+=a.source+'|'););return RegExp(s+'(\\S+)','g')}(
   //1-key
   //.2-type
   /((#?)([a-zA-Z]\w*)(?:\[([a-zA-Z]\w*(?:,[a-zA-Z]\w*)*)])?([?+*]?)(?:~([a-zA-Z]\w*))?\s*:)/,
   //    ^3-name           ^4-params                        ^5-tag      ^6-embed
   //7-item
   /((?:[a-zA-Z]\w*(?:\[[?+-][a-zA-Z]\w*(?:,[?+-][a-zA-Z]\w*)*\])?|\/(?:\\.|\[(?:\\.|[^\]])*]|[^\/*\n\r])(?:\\.|\[(?:\\.|[^\]])*]|[^\/\n\r])*?\/)[?+*]?(?:~[A-Za-z]\w*)?)/,
   //.8-divide
   /((?:\[([+-])([a-zA-Z]\w*)\])|\n(?:\s*\n)*|\||;.*)/
   //     ^9-up ^10-condition                         ^11-bad
   ));
   */
  var reElem = /^([a-zA-Z]\w*)\[([?+-][a-zA-Z]\w*(?:,[?+-][a-zA-Z]\w*)*)\]/;
  var reSymbol =/(?:([a-zA-Z]\w*)|\/((?:\\.|\[(?:\\.|[^\]])*]|[^\/*\n\r])(?:\\.|\[(?:\\.|[^\]])*]|[^/\n\r])*?)\/)([?+*]?)(?:~([A-Za-z]\w*))?/;

  var tags = ' ?+*';
  var reNext = /\s*(?:\S+|$)/g;
  var reLn = /\n/g;

  return Parse;

  function Parse(grammar) {
    if (isString(grammar))
      grammar = init(grammar);

    grammar = make(grammar);
    link(grammar);

    return bind(parse, grammar);
  }

  function init(code) {
    var grammar = object(), ms, name, symbol, produce, p = 0, s = 0;
    code = trim(code);
    reInit.lastIndex = 0;
    if (ms = exec(reInit, code)) {
      if (!ms[1])
        throw error('Grammar error: %s', ms[0]);
      grammar[0] = ms[3]; // 记录根语法符号名
      symbol = object();
      produce = object();

      do {
        if (ms[11])    // bad
          throw error('Grammar error: %s', ms[0]);
        if (ms[7]) {  // item
          produce[s++] = ms[0];
        }
        else {  // divide or key
          if (s) {
            symbol[p++] = produce;
            produce = object();
            s = 0;
          }
          if (ms[8]) { // divide
            if (ms[9]) {
              produce.u = +(ms[9] == '+');
              produce.c = ms[10];
            }
          }
          else if (ms[1]) {  // key
            if (p) {
              grammar[name] = symbol;
              symbol = object();
              p = 0;
            }
            name = ms[3];
            var embed = ms[6];
            if (embed) {
              symbol.e = embed;
            }
            else if (ms[2]) { // type
              symbol.t = name;
            }
            var params = ms[4];
            if (params) {
              symbol.p = split(params, ',');
            }
            var tag = ms[5];
            symbol.m = (indexOf(tags, tag) + 1) % 2;
          }
        }
      } while (ms = exec(reInit, code));

      if (s)
        symbol[p++] = produce;

      if (p)
        grammar[name] = symbol;
    }

    return grammar;
  }

  function make(srcGrammar) {
    var desGrammar = object();
    desGrammar[0] = srcGrammar[0];
    delete srcGrammar[0];

    var srcNames = getOwnPropertyNames(srcGrammar);
    for (var sn = 0, srcName; srcName = srcNames[sn]; sn++) {
      var srcSymbol = srcGrammar[srcName];

      // 生成可能的符号参数组合：
      var params = srcSymbol.p ? piece(srcSymbol.p) : [];
      for (var mix = 1, len = params.length; mix < len; mix++)
        for (var bas = 0, end = len-mix; bas < end; bas++)
          for (var pos = bas + 1; pos <= end; pos++)
            push(params, params[bas] + join(piece(params, pos, pos + mix), ''));

      var param = '';
      for (var p = -1; p < params.length;) {  // p 从 -1 开始将先处理初始符号名
        var desSymbol = object();
        var desName = srcName + param;
        for (var dp = 0, sp = 0, srcProduce; srcProduce = srcSymbol[sp]; sp++) {
          var condition = srcProduce.c;
          if (condition) {
            condition = +(indexOf(param, condition) > -1);
            if (condition ^ srcProduce.u)
              continue;
          }
          var desProduce = desSymbol[dp++] = object();
          if(srcSymbol.e)
            desSymbol.e = srcSymbol.e;
          if(srcSymbol.t)
            desSymbol.t = srcSymbol.t;
          desSymbol.m = srcSymbol.m;
          for (var e = 0, elem; elem = srcProduce[e]; e++) {
            desProduce[e] = replace(elem, reElem, function (s, name, list) {
              list = split(list, ',');
              for (var i = 0, v; v = list[i]; i++) {
                s = slice(v, 1);
                v = v[0];
                if (v === '+' || v === '?' && indexOf(param, s) >= 0)
                  name += s;
              }
              return name;
            });
          }
        }
        param = params[++p];  //因为从 -1 开始，一定要先增

        desGrammar[desName] = desSymbol;
      }
    }
    return desGrammar;
  }

  function link(grammar) {
    var root = grammar[0];
    delete grammar[0];
    var names = getOwnPropertyNames(grammar);
    var symbols = object(grammar);  // 建立临时语法对象空间

    for(var i=0, name; name=names[i]; i++)
      fuse(name, []);

    // for (var i = names.length; i--; )
    //   fuse(names[i], []);

    grammar[0] = grammar[root]; // 重设根语法符号

    function fuse(name, trail) {
      var ms = match(name, reSymbol);
      var symbol = symbols[name], p, produce, i;
      if (symbol) {
        if (ms[1]) {  // 初始符号：
          if (trail.indexOf(name) >= 0)
            throw error('Circle grammar: %s->%s', trail.join('->'), name);
          if (!symbol.$) {  // 如果尚未连接：
            push(trail, name);
            symbol.$ = name;
            if (symbol.e)
              symbol.e = fuse(symbol.e, trail);

            var must = 0;
            for (p = 0; produce = symbol[p]; p++) {
              var option = 1;
              for (i = 0; name = produce[i]; i++) {
                var item = produce[i] = fuse(name, option ? trail : []);
                option &= item.m ^ 1;
              }
              must |= option ^ 1;   //只要产生式中含有一个必要符号，则本符号为比要符号
            }
            symbol.m &= must;
            pop(trail);
          }
        }
      }
      else {    // 临时符号：
        var source = ms[1] || ms[2];
        var tag = ms[3];
        var embed = ms[4];
        i = indexOf(tags, tag) + 1;
        if (ms[2]) { //正则表达式
          symbol = symbols[name] = RegExp(source + '|', 'g');
        }
        else {
          if (!tag)
            throw error('Undefined grammar: %s', name);
          symbol = symbols[name] = object();  //要先占位symbolName，否则会死循环
          symbol.$ = source;                  //要先设置 $，否则出错
          source = fuse(source, trail);
          for (p = 0; produce = source[p]; p++)
            symbol[p] = produce;
          if (!embed) {
            if (source.t)
              symbol.t = source.t;
            if (i < 2) {
              symbol.m = source.m;
              symbol.g = source.g;
            }
            else {
              symbol.m = i % 2;
              symbol.g = +(i > 2);
            }
          }
        }
        if (embed) {
          symbol.e = embed = fuse(embed, trail);
          symbol.m = embed.m;
        }
        else {
          symbol.m = i % 2;
          symbol.g = +(i > 2);
        }
      }

      return symbol;
    }
  }

  // parse(symbol, code)
  function parse(code, name) {
    var token,
      serial = {s: code, i: 0, r: 0, c: 0},
      symbol = this[name || 0];

    if (!symbol)
      throw error('Unknown symbol %s.', name);

    token = read(symbol, serial);

    if (isInteger(token)) {
      serial.i = token;
      if (symbol.m)
        throw error('Syntax error: %s', get(reNext, serial) || '<EOF>');
      token = undefined;
    }

    if (serial.i < code.length)
      throw error('Syntax error: %s', get(reNext, serial) || '<EOF>');

    return token;
  }


  // token|err = read(symbol, serial)
  function read(symbol, serial) {
    var token;
    var idx = serial.i, row = serial.r, col = serial.c;
    if (symbol.exec) {   //正式表达式
      if (!(token = get(symbol, serial)))
        token = serial.i;
    }
    else {
      token = serial.i;
      for (var p = 0, produce; produce = symbol[p]; p++) {
        var item = reads(produce, serial);
        if(isInteger(item)){
          if(item>idx) {  //回溯
            serial.i = idx;
            serial.r = row;
            serial.c = col;
          }
          if(token < item)
            token = item;
        }
        else {
          token = item;
          break;
        }
      }
    }
    if(!isInteger(token)) {
      if (symbol.e) {
        symbol = symbol.e;
        token = read(symbol, {s: serial.s, i: idx, r: row, c: col, l: serial.i})
      }
      if(!isInteger(token) && symbol.t){
        token.t = symbol.t;
        token.i = idx;
        token.r = row;
        token.c = col;
        token.l = serial.i - idx;
      }
    }
    return token;
  }

  function reads(produce, serial) {
    var token = object(), len = 0, prev = -1, symbol;
    for (var s = 0; symbol = produce[s]; s++) {
      var got = symbol.g | 0;
      do {
        var item = read(symbol, serial);

        if (isInteger(item)) break;
        if (isString(item)) {
          if (prev < 0) {
            token[prev = len++] = item;
          }
          else {
            token[prev] += item;
          }
        }
        else if (item.t) {
          token[len++] = item;
          prev = -1;
        }
        else {
          for (var kid, k = 0; kid = item[k]; k++) {
            if (isString(kid)) {
              if (prev < 0) {
                token[prev = len++] = kid;
              }
              else {
                token[prev] += kid;
              }
            }
            else {
              token[len++] = kid;
              prev = -1;
            }
          }
        }
      } while (got++);

      if (symbol.m && !got)
        return item;
    }

    if (!len) {
      token = serial.i;
    }

    return token;
  }

  function get(re, serial, to) {
    var token, ms;
    re.lastIndex = serial.i;
    if ((token = exec(re, serial.s)) && (token = token[0]) && !(re.lastIndex > to)) {
      var len = re.lastIndex - serial.i;
      serial.i = re.lastIndex;
      reLn.lastIndex = 0;
      for(var ln=0; ms=exec(reLn, token); ln++)
        var i = reLn.lastIndex;
      if(ln) {
        serial.r += ln;
        serial.c = len - i;
      }
      else {
        serial.c += len;
      }
      return token;
    }
  }

}();
