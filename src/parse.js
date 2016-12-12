// parse.js ----------------------------------------------------------------------------------------

// parse = Parse(grammar)
var Parse = function () {
  var reMake = /((#?)([A-Za-z]\w*)([?+*]?)(?:~([A-Za-z]\w*))?\s*(:))|((?:[a-zA-Z]\w*|\/(?:\\.|\[(?:\\.|[^\]])*]|[^\/*\n\r])(?:\\.|\[(?:\\.|[^\]])*]|[^/\n\r])*?\/)[?+*]?(?:~[A-Za-z]\w*)?)|(\n(?:\s*\n)*|\||;.*)|(\S+)/g;
  var reItem = /(?:([a-zA-Z]\w*)|\/((?:\\.|\[(?:\\.|[^\]])*]|[^\/*\n\r])(?:\\.|\[(?:\\.|[^\]])*]|[^/\n\r])*?)\/)([?+*]?)(?:~([A-Za-z]\w*))?/;
  var tags = ' ?+*';
  var reNext = /\s*(?:\S+|$)/g;
  var reLn = /\n/g;

  return Parse;

  function Parse(grammar) {
    var root;
    if (isString(grammar))
      grammar = make(grammar);

    var names = getOwnPropertyNames(grammar);
    for (var i = names.length; i--;) {
      var name = names[i];
      link(name, []);
    }

    grammar[0] = root;

    return bind(parse, grammar);

    // 创建语法的基础符号表
    function make(code) {
      var grammar = object(), ms, name, symbol, produce, p = 0, s = 0;
      code = trim(code);
      reMake.lastIndex = 0;
      if (ms = exec(reMake, code)) {
        if (!ms[1])
          throw error('Grammar error: %s', ms[0]);
        root = symbol = object();
        produce = object();

        do {
          if (ms[9])
            throw error('Grammar error: %s', ms[0]);
          if (ms[7]) {
            produce[s++] = ms[0];
          }
          else {
            if (s) {
              symbol[p++] = produce;
              produce = object();
              s = 0;
            }
            if (ms[1]) {
              if (p) {
                grammar[name] = symbol;
                symbol = object();
                p = 0;
              }
              name = ms[3];
              var tag = ms[4];
              var embed = ms[5];
              if(embed) {
                symbol.e = embed;
              }
              else if(ms[2]){
                symbol.t = name;
              }
              symbol.m = (indexOf(tags, tag) + 1) % 2;
            }
          }
        } while (ms = exec(reMake, code));

        if (s)
          symbol[p++] = produce;

        if (p)
          grammar[name] = symbol;
      }

      return grammar;
    }

    function link(name, path) {
      var ms = match(name, reItem);
      var symbol = grammar[name], p, produce, i;
      if(symbol) {
        if(ms[1]) {
          if (path.indexOf(name) >= 0)
            throw error('Circle syntax: %s->%s', path.join('->'), name);
          if (!symbol.$) {
            symbol.$ = name;
            path.push(name);
            if(symbol.e) {
              symbol.e = link(symbol.e, path);
            }
            var must = 0;
            for (p = 0; produce = symbol[p]; p++) {
              var option = 1;
              for (i = 0; name = produce[i]; i++) {
                var item = produce[i] = link(name, option ? path : []);
                option &= item.m ^ 1;
              }
              must |= option ^ 1;
            }
            symbol.m &= must;
            path.pop();
          }
        }
      }
      else {
        var source = ms[1] || ms[2];
        var tag = ms[3];
        var embed = ms[4];
        i = indexOf(tags, tag) + 1;
        if(ms[2]) { //正则表达式
          symbol = grammar[name] = RegExp(source + '|', 'g');
        }
        else {
          if (!tag)
            throw error('Undefined grammar: %s', name);
          symbol = grammar[name] = object();  //要先占位symbolName，否则会死循环
          source = link(source, path);
          for (p = 0; produce = source[p]; p++)
            symbol[p] = produce;
          if(!embed) {
            if(source.t)
              symbol.t = source.t;
            if(i<2) {
              symbol.m = source.m;
              symbol.g = source.g;
            }
            else {
              symbol.m = i%2;
              symbol.g = +(i>2);
            }
          }
        }
        if(embed) {
          symbol.e = embed = link(embed, path);
          symbol.m = embed.m;
        }
        else {
          symbol.m = i % 2;
          symbol.g = +(i > 2);
        }
      };

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
