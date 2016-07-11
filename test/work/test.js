//#define MAX_LEN 123
//#define NO(x) "01234"[x]

//#regular r0 /\./
var x = /^\w+<r0>\w+/;

describe('test.js', function(){
  describe('macro.js is unseen', function(){
    //its(
    lex.should.throw();;
    make.should.throw();;
    //);
  });

  describe('#define', function(){
    //its(
    Should(MAX_LEN).equal(123);;
    Should(NO(1)).equal('1');;
    //);
  });
});