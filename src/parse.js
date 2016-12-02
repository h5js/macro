// parse.js ----------------------------------------------------------------------------------------

// parse = Parse(grammar)
var Parse = bind(function (toProduce, toSymbol, reTag, reNext, grammar) {
    var symbols = object();

    grammar = grammar.split(this);

    for (var s = 0; s < grammar.length; s++) {
      var symbolCode = grammar[s];
      if (symbolCode) {
        var j = symbolCode.indexOf(':');
        var symbolName = symbolCode.substr(0, j).trim();
        if (symbolName) {
          var symbol = object();
          symbol._ = 1;   //未编译状态
          symbolCode = symbolCode.slice(j + 1).trim();
          symbolCode = symbolCode.split(toProduce);
          for (var p = 0; p < symbolCode.length; p++) {
            var produceCode = symbolCode[p];
            var produce = object();
            if (produceCode = produceCode.match(toSymbol)) {
              for (var i = 0; i < produceCode.length; i++) {
                produce[i] = produceCode[i];
              }
              produce.l = i;
            }
            else {
              throw error('symbol % production %d error!', symbolName, p);
            }
            symbol[p] = produce;
          }
          symbol.l = p;
          symbols[symbolName] = symbol;
        }
      }
    }

    var symbolNames = Object.getOwnPropertyNames(symbols);
    for (s = 0; s < symbolNames.length; s++) {
      symbolName = symbolNames[s];
      make(symbolName);
    }

    function make(symbolName) {
      var symbol = symbols[symbolName], source, p;
      if(!symbol) {
        var tag = symbolName.match(reTag);
        if(symbolName[0]=='/') {  //正则式
          source = symbolName.slice(1, tag ? -2 : -1);
          symbols[symbolName] = symbol = RegExp(source + '|', 'g');
        }
        else if(tag) {
          symbols[symbolName] = symbol = object();  //要先占位symbolName，否则会死循环
          source = make(symbolName.slice(0, -1));
          for(var p=0; p<source.l; p++)
            symbol[p] = source[p];
          symbol.l = p;
          symbol.t = source.t;
        }
        else {
          throw error('Undefined symbol: %s', symbolName);
        }
        if(tag) symbol.$ = tag[0];
      }
      else if(symbol._){    //未编译
        delete symbol._;
        for(p=0; p<symbol.l; p++) {
          var produce = symbol[p];
            for(i=0; i<produce.l; i++) {
              produce[i] = make(produce[i]);
          }
        }
        symbol.t = symbolName;
      }
      return symbol;
    }

    console.log(symbols);

    function readSymbol(symbol, serial) {
      var token;
      if (symbol.exec) {   //正式表达式
        if (token = get(symbol, serial)) {
          serial.i = symbol.lastIndex;
          return token;
        }
      }
      else {
        for (var p = 0; p < symbol.l; p++) {
          var produce = symbol[p], back = serial.i;
          if (token = readProduce(produce, serial)) {
            token.t = symbol.t;
            return token;
          }
        }
        var tag = symbol.$;
        if (!(tag && tag != '+')) {
          var token;
          if(!(token = get(reNext, serial)))
              token = '<EOF>';
          throw error('Syntax error: %s', token);
        }
      }
    }

    function readProduce(produce, serial) {
      var token = object(), len = 0, back = serial.i;
      for (var i = 0; i < produce.l; i++) {
        symbol = produce[i];
        var tag = symbol.$;
        var goon = tag ? tag == '?' ? -1 : 1 : -1;
        var item;
        while (goon && (item = readSymbol(symbol, serial))) {
          token[len++] = item;
          goon ++;
        }
        if (!(tag && tag != '+') && goon < 0) {
          serial.i = back;
          return;
        }
      }
      if (len) {
        token.l = len;
        return token;
      }
    }

    function get(re, serial) {
      re.lastIndex = serial.i;
      if (token = re.exec(serial.s)) {
        return token[0];
      }
    }

    // parse(symbol, code)
    return function (name, code) {
      var symbol = symbols[name], serial = {s: code}, token;
      if (symbol) {
        token = readSymbol(symbol, serial);
      }
      else {
        throw error('Unknown symbol %s.', name);
      }
      if(serial.i < code.length)
        throw error('Syntax error: %s', get(reNext, serial));
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
  /\s*(?:\S+|$)/g
);
