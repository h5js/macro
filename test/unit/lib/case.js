describe('lib.js', function(){
  describe('isId()', function(){
    //its(
    isId('a').should.be.true;;
    isId('A').should.be.true;;
    isId('$').should.be.true;;
    isId('_').should.be.true;;
    isId('abc').should.be.true;;
    isId('ABC').should.be.true;;
    isId('$$').should.be.true;;
    isId('__').should.be.true;;
    isId('a01').should.be.true;;
    isId('A01').should.be.true;;
    isId('$01').should.be.true;;
    isId('_01').should.be.true;;
    isId('').should.be.false;;
    isId('0').should.be.false;;
    isId('-').should.be.false;;
    isId('012').should.be.false;;
    isId('abc-01').should.be.false;;
    isId('012abc').should.be.false;;
    isId('012-abc').should.be.false;;
    isId('012_abc').should.be.false;;
    //);
  });

  describe('keynames()', function(){
    var obj;
  });
});

