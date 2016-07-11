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
  var ln, theSymbol, theIndex, lastIndex, l, c;
  ln = /[\n\u2028\u2029]|\r\n?/g;
  theIndex = lastIndex = l = c = 0;

  return function() {
    var Symbol, ms, s, t, w;

    if(lastIndex^theIndex) { //若有缓存的符号, 则先返回缓存的符号
      Symbol = theSymbol;
      s = Symbol.s;
      theIndex = lastIndex;
    }
    else {
      lexis.lastIndex = lastIndex;  //恢复状态
      if (ms = lexis.exec(code)) { //搜寻下一个词汇
        s = ms[0];                    //取词汇符号原文 s
        for (t = ms.length; ms[--t] === undefined;);   //计算词汇符号类型 t
        theIndex = ms.index;                 //记下词汇符号位置 i
        Symbol = {s: s, t: t, i: theIndex};      //形成词汇符号对象 Symbol
      }
      else {
        theIndex = code.length;
      }

      if (lastIndex ^ theIndex) {   //若解析开始位置与词汇符号未知不一致, 则中间有未知符号
        theSymbol = Symbol;                    //词汇符号应该缓存到下次读取
        s = code.substring(lastIndex, theIndex); //取未知符号原文 s
        Symbol = {s: s, t: 0, i: lastIndex};   //形成未知符号 Symbol
        lastIndex = lexis.lastIndex || theIndex;
      }
      else {
        lastIndex = theIndex = lexis.lastIndex;
      }
    }
    
    //下面计算符号在源代码中的行列位置:
    if(located && Symbol) {
      Symbol.l = l;     //设置符号的行为本次解析的行位置
      Symbol.c = c;     //设置符号的列为本次解析的列位置
      w = s.length;       //记录符号字符串长度
      c += w;  //默认下次解析的列号为原列号加上本次符号的长度
      while(ln.exec(s)) {             //若本次符号解析到换行
        l ++;                   //下次解析的行号+1
        c = w - ln.lastIndex;   //下次解析的列号就是符号原文最后一行的字符数
      }
    }
    return Symbol;
  };
}
