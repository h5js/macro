describe('lex.js', function(){
  describe('lex()', function(){
    var code, lexis, read;
    //its(
    Should(lex).be.Function;;
    code = 'any012';;
    lexis = /(\0)|(\d+)/g;;
    read = lex(code, lexis);;
    Should(read()).eql({s: 'any', t: 0, i: 0});;
    Should(read()).eql({s: '012', t: 2, i: 3});;
    Should(read()).equal(undefined);;
    Should(read()).eql({s: 'any', t: 0, i: 0});;
    Should(read()).eql({s: '012', t: 2, i: 3});;
    Should(read()).equal(undefined);;
    //);
  });
});

