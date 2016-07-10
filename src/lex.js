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
  return function(code, lexis) {
    var $, ms, s, t, i, ln, w;

    if(lexis.$) { //若有缓存的符号, 则先返回缓存的符号
      $ = lexis.$;
      lexis.$ = 0;
      s = $.s;
    }
    else if( ms = lexis.exec(code)) { //搜寻下一个词汇
      s = ms[0];                    //取词汇符号原文 s
      for(t=ms.length;!ms[--t];);   //计算词汇符号类型 t
      i = ms.index;                 //记下词汇符号位置 i
      $ = {s: s, t: t, i: i };      //形成词汇符号对象 $

      if(lexis.i ^ i) {   //若解析开始位置与词汇符号未知不一致, 则中间有未知符号
        lexis.$ = $;                    //词汇符号应该缓存到下次读取
        s = code.substring(lexis.i, i); //取未知符号原文 s
        $ = {s: s, t: 0, i: lexis.i|0};   //形成未知符号 $
      }
      lexis.i = lexis.lastIndex;
    }
    else {  //若搜寻结束后解析尾部
      i = code.length;  //记下结束位置;
      if(lexis.i ^ i) {  //若解析开始位置与结束位置不一致, 则尾部是未知符号
        s = code.substring(lexis.i);      //取未知符号原文 s
        $ = {s: s, t: 0, i: lexis.i|0};   //形成未知符号 $
        lexis.i = lexis.lastIndex = i;    //下次从结束位值开始, 确保下次解析结束
      }
      else {
        lexis.i = 0;  //解析结束, 但设置lexis为0可让解析器开始新的一轮循环
      }
    }

    //下面计算符号在源代码中的行列位置:
    if(located && $) {
      ln = this;          //换行符正则式
      $.l |= lexis.l;     //设置符号的行为本次解析的行位置
      $.c |= lexis.c;     //设置符号的列为本次解析的列位置
      w = s.length;       //记录符号字符串长度
      lexis.l = $.l;      //默认下次解析的行号不变
      lexis.c = $.c + w;  //默认下次解析的列号为原列号加上本次符号的长度
      while(ln.exec(s)) {             //若本次符号解析到换行
        lexis.l ++;                   //下次解析的行号+1
        lexis.c = w - ln.lastIndex;   //下次解析的列号就是符号原文最后一行的字符数
      }
    }

    return $;

  }.bind(/\n/g, code, lexis);
}
