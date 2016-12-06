// parse.js ----------------------------------------------------------------------------------------

// parse = Parse(grammar)
var Parse = function () {
  var reSplitGrammar = /(?:^|[ \t]*\n)[ \t]*(?:\n[ \t]*)+|\s*$/;
  var reSplitBlock = /[ \t]*\n[ \t]*/;
  var reSymbol = /(?:\/.*?\/|[A-Za-z]\w*|\d+)[?+*]?/g;
  var tags = '?+*';
  var reNext = /\s*(?:\S+|$)/g;

  return Parse;

  function Parse(grammar) {
    if (isString(grammar)) {
      grammar = init(grammar);
    }
    linkGrammar(grammar);
    return bind(parse, grammar);
  }

  // 创建语法的基础符号表
  function init(code) {
    var grammar = object();
    code = split(code, reSplitGrammar);

    for (var s = code.length; s--;) {
      var block = code[s];
      if (block) {
        var i = indexOf(block, ':');
        var name = trim(slice(block, 0, i));
        if (name) {
          var symbol = object();
          block = trim(slice(block, i + 1));
          block = split(block, reSplitBlock);
          var row;
          for (var p = 0; row = block[p]; p++) {
            var produce = object();
            if (row = match(row, reSymbol)) {
              for (i = 0; i < row.length; i++) {
                produce[i] = row[i];
              }
              produce.l = i;
            }
            else {
              throw error('symbol % production %d error!', name, p);
            }
            symbol[p] = produce;
          }
          p = indexOf(tags, slice(name, -1)) + 2;
          symbol.m = p % 2;
          if (p > 1)
            name = slice(name, -1);
          if (name[0] == '#') {
            name = slice(name, 1);
            symbol.t = name;
          }
          grammar[name] = symbol;
        }
      }
    }
    grammar[0] = symbol;  //默认根符号
    return grammar;
  }

  function linkGrammar(grammar) {
    var names = getOwnPropertyNames(grammar);
    for (var i = names.length; i--;) {
      link(names[i]);
    }
    function link(name) {
      var symbol = grammar[name], p, i;
      if (symbol) {
        if (!symbol.l) {
          symbol.l = -1;
          var produce, item;
          for (p = 0; produce = symbol[p]; p++)
            for (i = 0; item = produce[i]; i++)
              produce[i] = link(produce[i]);
          symbol.l = p;
        }
      }
      else {
        i = indexOf(tags, slice(name, -1)) + 2;
        var source = i > 1 ? slice(name, 0, -1) : name;
        if (name[0] == '/') {
          grammar[name] = symbol = RegExp(slice(source, 1, -1) + '|', 'g');
        }
        else if (i > 0) {
          grammar[name] = symbol = object();  //要先占位symbolName，否则会死循环
          source = link(source);
          for (p = 0; produce = source[p]; p++)
            symbol[p] = produce;
          symbol.l = p;
          if (source.t)
            symbol.t = source.t;
        }
        else {
          throw error('Undefined symbol: %s', name);
        }
        symbol.m = i % 2;
        symbol.g = +(i > 2);
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
    var token = object(), len = 0, back = serial.i;
    for (var i = 0; i < produce.l; i++) {
      var symbol = produce[i];

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
    if (token = re.exec(serial.s)) {
      return token[0];
    }
  }

}();
