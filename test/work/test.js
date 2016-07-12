//#define MAX_LEN 123
//#define NO(x) "01234"[x]
//#define id /[a-zA-Z_$][\w$]*/
//#define blank /\s+/
//#define number /\d+/
//#define sys_id /$<id>/

describe('test.js', function(){
  describe('macro.js is unseen', function(){
    //its(
    lex.should.throw();;
    make.should.throw();;
    //);
  });

  describe('#define macro', function(){
    //its(
    Should(MAX_LEN).equal(123);;
    Should(NO(1)).equal('1');;
    //);
  });

  describe('#define regexp', function(){
    //its(
    Should(/#<id><blank><number>/).eql(/#[a-zA-Z_$][\w$]*\s+\d+/);;
    Should(/#<sys_id><blank><number>/).eql(/#$[a-zA-Z_$][\w$]*\s+\d+/);;
    //);
  });

});