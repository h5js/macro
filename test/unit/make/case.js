describe('make.js', function(){
  describe('makeCode()', function(){
    describe("unchanged code", function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      Should(macro('')).equal('');;
      Should(macro('123')).equal('123');;
      Should(macro('"hello"')).equal('"hello"');;
      Should(macro("'hello'")).equal("'hello'");;
      Should(macro('/abc/')).equal('/abc/');;
      //);

    });

    describe("#include", function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      Should(macro('//#include /macro/test/unit/make/inc/hello.js')).equal('hello');;
      Should(macro('//#include /macro/test/unit/make/inc/hello.js')).equal('');;
      //);
    });

    describe("#define macro", function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      macro('//#define ').should.equal('');;
      macro('//#define \n').should.equal('');;
      macro('/*#define */').should.equal('');;
      macro('/*#define */\n').should.equal('');;

      macro('  //#define ').should.equal('');;
      macro('  //#define \n').should.equal('');;
      macro('  /*#define */').should.equal('');;
      macro('  /*#define */\n').should.equal('');;

      macro('//#define x').should.equal('');;
      macro('//#define x\n').should.equal('');;
      macro('/*#define x*/').should.equal('');;
      macro('/*#define x*/\n').should.equal('');;

      Should(macro('//#define x 123\nx')).equal('123/*x*/');;
      Should(macro('/*#define x 123*/x')).equal('123/*x*/');;
      Should(macro('/*#define x 123*/\nx')).equal('123/*x*/');;

      Should(macro('//#define max(a, b) (a>b?a:b)\nmax(x, 5)')).equal('(x>5?x:5)/*max*/');;
      Should(macro('/*#define max(a, b) (a>b?a:b)*/max(x, 5)')).equal('(x>5?x:5)/*max*/');;
      Should(macro('/*#define max(a, b) (a>b?a:b)*/\nmax(x, 5)')).equal('(x>5?x:5)/*max*/');;

      //);
    });

    describe("#define regexp", function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      Should(macro('//#define b /\\s*/\n/<b>/')).equal('/\\s*/');;
      Should(macro('/*#define b /\\s+/*//<b>/')).equal('/\\s+/');;
      Should(macro('/*#define b /\\s+/*/\n/<b>/')).equal('/\\s+/');;
      //);
    });

    describe('#define macro =', function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      macro('//#define a = 123\n//#define b = a+1\nb').should.equal('124/*b*/');;
      //);
    });

    describe('#var x = 123', function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      macro('//#var x = 123\n//#var y=x+1\n//#define z=y+1\nz').should.equal('125/*z*/');;
      //);
    });

    describe('#var x = function(a, b){return a+b}', function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      macro('/*#var x = function(a,b){return a+b}*///#define y=x(2,3)\ny').should.equal('5/*y*/');;
      //);
    });

    describe('#{ code }', function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      macro('//#var x = 1\n//#{x++}\n//#define y=x\ny').should.equal('2/*y*/');;
      //);
    });

    describe('#if(){ ... #}', function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      macro('a;\n//#if(c0){\nx;\n//#}\nb;').should.equal('a;\nb;');;
      macro('a;\n//#var c0=true\n//#if(c0){\nx;\n//#}\nb;').should.equal('a;\nx;\nb;');;
      //);
    });

    describe('#if(){ ... #}else{ ... #}', function(){
      var macro;
      //its(
      macro = makeCode.bind(undefined, Context());;
      macro('a;\n//#if(c0){\nx;\n//#}else{\ny;\n//#}\nb;').should.equal('a;\ny;\nb;');;
      macro('a;\n//#var c0=true\n//#if(c0){\nx;\n//#}else{\ny;\n//#}\nb;').should.equal('a;\nx;\nb;');;
      //);
    });

  });
});
