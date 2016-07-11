describe('lex.js', function(){
  describe('lex()', function(){
    describe('use lex() for unmatched code', function(){
      var read;
      //its(
      read = lex('', /(?:)/g);;
      Should(read()).eql({ s:'', t:0, i:0 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'', t:0, i:0 });;
      Should(read()).undefined;;

      read = lex('abc', /(\d+)/g);;
      Should(read()).eql({ s:'abc', t:0, i:0 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'abc', t:0, i:0 });;
      Should(read()).undefined;;
      //);
    });

    describe("use lex() for symbol", function(){
      var read;
      //its(
      read = lex('', /((?:))/g);;
      Should(read()).eql({ s:'', t:1, i:0 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'', t:1, i:0 });;
      Should(read()).undefined;;

      read = lex('', /(\B)/g);;
      Should(read()).eql({ s:'', t:1, i:0 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'', t:1, i:0 });;
      Should(read()).undefined;;

      read = lex('0', /(\d)/g);;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).undefined;;

      read = lex('a0', /(\d)/g);;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).undefined;;

      read = lex('0a', /(\d)/g);;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'a', t:0, i:1 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'a', t:0, i:1 });;
      Should(read()).undefined;;

      read = lex('a0b', /(\d)/g);;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).undefined;;

      read = lex('01', /(\d)/g);;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'1', t:1, i:1 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'1', t:1, i:1 });;
      Should(read()).undefined;;

      read = lex('a01', /(\d)/g);;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'1', t:1, i:2 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'1', t:1, i:2 });;
      Should(read()).undefined;;

      read = lex('0a1', /(\d)/g);;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'a', t:0, i:1 });;
      Should(read()).eql({ s:'1', t:1, i:2 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'a', t:0, i:1 });;
      Should(read()).eql({ s:'1', t:1, i:2 });;
      Should(read()).undefined;;

      read = lex('01a', /(\d)/g);;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'1', t:1, i:1 });;
      Should(read()).eql({ s:'a', t:0, i:2 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'1', t:1, i:1 });;
      Should(read()).eql({ s:'a', t:0, i:2 });;
      Should(read()).undefined;;

      read = lex('a0b1', /(\d)/g);;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).eql({ s:'1', t:1, i:3 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).eql({ s:'1', t:1, i:3 });;
      Should(read()).undefined;;

      read = lex('0b1c', /(\d)/g);;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'b', t:0, i:1 });;
      Should(read()).eql({ s:'1', t:1, i:2 });;
      Should(read()).eql({ s:'c', t:0, i:3 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'0', t:1, i:0 });;
      Should(read()).eql({ s:'b', t:0, i:1 });;
      Should(read()).eql({ s:'1', t:1, i:2 });;
      Should(read()).eql({ s:'c', t:0, i:3 });;
      Should(read()).undefined;;

      read = lex('a0b1c', /(\d)/g);;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).eql({ s:'1', t:1, i:3 });;
      Should(read()).eql({ s:'c', t:0, i:4 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).eql({ s:'1', t:1, i:3 });;
      Should(read()).eql({ s:'c', t:0, i:4 });;
      Should(read()).undefined;;

      read = lex('a0b1c2d', /(\d)/g);;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).eql({ s:'1', t:1, i:3 });;
      Should(read()).eql({ s:'c', t:0, i:4 });;
      Should(read()).eql({ s:'2', t:1, i:5 });;
      Should(read()).eql({ s:'d', t:0, i:6 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).eql({ s:'1', t:1, i:3 });;
      Should(read()).eql({ s:'c', t:0, i:4 });;
      Should(read()).eql({ s:'2', t:1, i:5 });;
      Should(read()).eql({ s:'d', t:0, i:6 });;
      Should(read()).undefined;;

      read = lex('a0b#c2d', /(\d)|(#)/g);;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).eql({ s:'#', t:2, i:3 });;
      Should(read()).eql({ s:'c', t:0, i:4 });;
      Should(read()).eql({ s:'2', t:1, i:5 });;
      Should(read()).eql({ s:'d', t:0, i:6 });;
      Should(read()).undefined;;
      Should(read()).eql({ s:'a', t:0, i:0 });;
      Should(read()).eql({ s:'0', t:1, i:1 });;
      Should(read()).eql({ s:'b', t:0, i:2 });;
      Should(read()).eql({ s:'#', t:2, i:3 });;
      Should(read()).eql({ s:'c', t:0, i:4 });;
      Should(read()).eql({ s:'2', t:1, i:5 });;
      Should(read()).eql({ s:'d', t:0, i:6 });;
      Should(read()).undefined;;

      //);
    });
  });
});

