describe('lib.js', function(){

  describe('object()', function(){
    //its(
    Should(object()).be.Object;;
    Should(Object.getPrototypeOf(object())).null;;
    //);
  });

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

  describe('error()', function(){
    //its(
    Should(error()).be.Object;;
    Should(error().message).equal('');;
    Should(error(undefined).message).equal('');;
    Should(error(null).message).equal('null');;
    Should(error('say').message).equal('say');;
    Should(error('say %s.', 'hello').message).equal('say hello.');;
    Should(error('say %s to %s.', 'hello', 'her').message).equal('say hello to her.');;
    Should(error('at age %s.', 18).message).equal('at age 18.');;
    Should(error('say %s to %s.').message).equal('say %s to %s.');;
    Should(error('say %s to %s.', 'hello').message).equal('say hello to %s.');;
    //);
  });
});

