describe('eval.js', function(){
  describe('Eval()', function(){
    var env, exec;
    //its(
    env = {nick: 'leadzen', age: 46};;
    exec = Eval(env);;
    Should(exec('')).equal(undefined);;
    exec('123').should.equal(123);;
    exec('nick').should.equal('leadzen');;
    exec('age+1').should.equal(47);;
    //);
  });
});

