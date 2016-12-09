// parse.js ----------------------------------------------------------------------------------------

// parse = Parse(grammar)
var Parse = function () {
  var reSplit = /((#?)([A-Za-z]\w*)([?+*])?\s*(:))|((?:[a-zA-Z]\w*|\/(?:\\.|\[(?:\\.|[^\]])*]|[^\/*\n\r])(?:\\.|\[(?:\\.|[^\]])*]|[^/\n\r])*?\/)[?+*]?)|(\n(?:\s*\n)*|\||;.*)|(\S+)/g;
  var tags = '?+*';
  var reNext = /\s*(?:\S+|$)/g;

  return Parse;

  function Parse(grammar) {
    if (isString(grammar))
      grammar = init(grammar);

    var names = getOwnPropertyNames(grammar);
    for (var i = names.length; i--;) {
      var name = names[i];
      link(name, []);
    }

    return bind(parse, grammar);

    // 创建语法的基础符号表
    function init(code) {
      var grammar = object(), ms, i, name, symbol, produce, p, s;
      code = trim(code);
      reSplit.lastIndex = 0;
      if (ms = exec(reSplit, code)) {
        for (i = 1; !ms[i]; i++);
        if (i != 1)
          throw error('Grammar error: %s', ms[0]);
        symbol = grammar[0] = object();
        name = ms[3];
        if (ms[2])
          symbol.t = name;
        symbol.m = (indexOf(tags, ms[4]) + 2) % 2;
        p = 0;
        produce = object();
        s = 0;

        while (ms = exec(reSplit, code)) {
          for (i = 1; !ms[i]; i++);
          if (i == 1) {  // symbol
            if (s) {
              symbol[p++] = produce;
              produce = object();
              s = 0;
            }
            if(p) {
              grammar[name] = symbol;
              symbol = object();
              p = 0;
            }
            name = ms[3];
            if (ms[2])
              symbol.t = name;
            symbol.m = (indexOf(tags, ms[4]) + 2) % 2;
          }
          else if (i == 6) { //item
            produce[s++] = ms[0];
          }
          else if (i == 7) { // spliter
            if (s) {
              symbol[p++] = produce;
              produce = object();
              s = 0;
            }
          }
        }

        if (s)
          symbol[p++] = produce;

        if(p)
          grammar[name] = symbol;
      }

      return grammar;
    }

    function link(name, path) {
      var symbol = grammar[name], source, p, produce, i;
      if (name[0] == '/') {
        if (!symbol) {
          i = indexOf(tags, slice(name, -1)) + 2;

          symbol = grammar[name] = RegExp(slice(name, 1, -1 - (i > 1)) + '|', 'g');
          symbol.m = i % 2;
          symbol.g = +(i > 2);
        }
      }
      else if (!symbol) {
        i = indexOf(tags, slice(name, -1)) + 2;
        if (i < 2)
          throw error('Undefined symbol: %s', name);
        symbol = grammar[name] = object();  //要先占位symbolName，否则会死循环
        source = link(slice(name, 0, -1), path);
        for (p = 0; produce = source[p]; p++)
          symbol[p] = produce;
        symbol.l = p;
        if (source.t)
          symbol.t = source.t;
        symbol.m = i % 2;
        symbol.g = +(i > 2);
      }
      else {
        if (path.indexOf(name) >= 0)
          throw error('Circle syntax: %s->%s', path.join('->'), name);
        if (!symbol.l) {
          path.push(name);
          symbol.l = -1;
          var must = 0;
          for (p = 0; produce = symbol[p]; p++) {
            var option = 1;
            for (i = 0; name = produce[i]; i++) {
              var item = produce[i] = link(name, option ? path : []);
              option &= item.m ^ 1;
            }
            must |= option ^ 1;
          }
          symbol.l = p;
          symbol.m &= must;
          path.pop();
        }
      }

      return symbol;
    }

  }

  // parse(symbol, code)
  function parse(code, name) {
    var symbol = this[name || 0], serial = {s: code, i: 0}, token;
    if (symbol) {
      token = readSymbol(symbol, serial);
      if (symbol.m) {
        if (isInteger(token)) {
          serial.i = token;
          throw error('Syntax error: %s', get(reNext, serial) || '<EOF>');
        }
      }
      else if (isInteger(token)) {
        token = undefined;
      }

      if (serial.i < code.length) {
        throw error('Syntax error: %s', get(reNext, serial) || '<EOF>');
      }
    }
    else {
      throw error('Unknown symbol %s.', name);
    }
    return token;
  }


  // token|err = readSymbol(symbol, serial)
  function readSymbol(symbol, serial) {
    var token;
    if (symbol.exec) {   //正式表达式
      if (token = get(symbol, serial)) {
        serial.i = symbol.lastIndex;
      }
      else {
        token = serial.i;
      }
    }
    else {
      token = serial.i;
      for (var p = 0; p < symbol.l; p++) {
        var produce = symbol[p];
        var item = readProduce(produce, serial);
        if (!isInteger(item)) {
          if (symbol.t) {
            item.t = symbol.t;
            for (var s = 0; s < item.l; s++) {
              var o = item[s];
              if (o.t) {
                var ts = item[o.t] || (item[o.t] = []);
                ts.push(o);
              }
            }
          }
          token = item;
          break;
        }
        else if (token < item) {
          token = item;
        }
      }
    }
    return token;
  }

  function readProduce(produce, serial) {
    var token = object(), len = 0, back = serial.i, symbol;
    for (var i = 0; symbol=produce[i]; i++) {

      var g = 0;
      do {
        var item = readSymbol(symbol, serial);

        if (isInteger(item)) break;

        if (item.length || symbol.t) {
          token[len++] = item;
        }
        else {
          for (var s = 0; s < item.l; s++) {
            token[len++] = item[s];
          }
        }
        g++;
      } while (symbol.g);

      if (symbol.m && !g) {
        serial.i = back;    //回溯
        return item;
      }
    }
    if (len) {
      token.l = len;
    }
    else {
      token = serial.i;
    }
    return token;
  }

  function get(re, serial) {
    var token;
    re.lastIndex = serial.i;
    if (token = exec(re, serial.s)) {
      return token[0];
    }
  }

}();
