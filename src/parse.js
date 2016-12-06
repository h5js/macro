// parse.js ----------------------------------------------------------------------------------------

// parse = Parse(grammar)
var Parse = bind(function (toProduce, toSymbol, reTag, reNext, bad, grammar) {
    var s, p, i, name,
      symbols = object();

    grammar = grammar.split(this);

    for (s = grammar.length; s--;) {
      var block = grammar[s];
      if (block) {
        i = block.indexOf(':');
        if (name = block.substr(0, i).trim()) {
          var symbol = object();
          block = block.slice(i + 1).trim();
          block = block.split(toProduce);
          for (p = 0; p < block.length; p++) {
            var row = block[p];
            var produce = object();
            if (row = row.match(toSymbol)) {
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
          symbol.l = p;
          var tag = '?+*'.indexOf(name.slice(-1));
          if(tag>=0) {
            name = name.slice(0, -1);
          }
          if(name[0] == '#') {
            name = name.slice(1);
            symbol.t = name;
          }
          if(!(tag%2)) symbol.o = 1;

          symbol._ = 1;   //未连接状态
          symbols[name] = symbol;
        }
      }
    }

    var root = name;  //根符号名

    var names = Object.getOwnPropertyNames(symbols);
    for (s = 0; s < names.length; s++) {
      name = names[s];
      make(name);
    }

    function make(name) {
      var symbol = symbols[name], source, p;
      if (!symbol) {
        var tag = '?+*'.indexOf(name.slice(-1));

        if (name[0] == '/') {  //正则式
          source = name.slice(1, tag < 0 ? -1 : -2);
          symbols[name] = symbol = RegExp(source + '|', 'g');
        }
        else if (tag<0) {
          throw error('Undefined symbol: %s', name);
        }
        else {
          symbols[name] = symbol = object();  //要先占位symbolName，否则会死循环
          source = make(name.slice(0, -1));
          for (p = 0; p < source.l; p++)
            symbol[p] = source[p];
          symbol.l = p;
          if(source.t)
            symbol.t = source.t;
        }
        if(!(tag%2)) symbol.o = 1;
        if(tag>0) symbol.g = 1;
      }
      else if (symbol._) {    //未连接
        delete symbol._;      //要先删除
        for (p = 0; p < symbol.l; p++) {
          var produce = symbol[p];
          for (i = 0; i < produce.l; i++) {
            produce[i] = make(produce[i]);
          }
        }
      }

      return symbol;
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
          if(!bad(item)) {
            if(symbol.t) {
              item.t = symbol.t;
              for(var s=0; s<item.l; s++) {
                var o = item[s];
                if(o.t) {
                  var ts = item[o.t] || (item[o.t] = []);
                  ts.push(o);
                }
              }
            }
            token = item;
            break;
          }
          else if(token<item){
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

          if(bad(item)) break;

          if(item.length || symbol.t) {
            token[len++] = item;
          }
          else {
            for(var s=0; s<item.l; s++) {
              token[len++] = item[s];
            }
          }
          g ++;
        } while(symbol.g);

        if (!symbol.o && !g) {
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

    // parse(symbol, code)
    return function (code, name) {
      var symbol = symbols[name || root], serial = {s: code, i: 0}, token, err;
      if (symbol) {
        token = readSymbol(symbol, serial);
        if(!symbol.o) {
          if(typeof token=='number'){
            serial.i = token;
            throw error('Syntax error: %s', get(reNext, serial) || '<EOF>');
          }
        }
        else {
          if(typeof token=='number') {
            token = undefined;
          }
        }

        if(serial.i<code.length) {
          throw error('Syntax error: %s', get(reNext, serial) || '<EOF>');
        }
      }
      else {
        throw error('Unknown symbol %s.', name);
      }
      return token;
    };
  },
  // this:
  /(?:^|[ \t]*\n)[ \t]*(?:\n[ \t]*)+|\s*$/,
  //toProduce:
  /[ \t]*\n[ \t]*/,
  // reProduce:
  /(?:\/.*?\/|[A-Za-z]\w*|\d+)[?+*]?/g,
  // reTag:
  /[?+*]$/,
  // reNext:
  /\s*(?:\S+|$)/g,
  //bad():
  function(token){
    return typeof token==='number';
  }
);
