describe('make.js', function(){
  describe('makeCode()', function(){
    describe("unchanged code", function(){
      //its(
      Should(makeCode('')).equal('');;
      Should(makeCode('123')).equal('123');;
      Should(makeCode('"hello"')).equal('"hello"');;
      Should(makeCode("'hello'")).equal("'hello'");;
      Should(makeCode('/abc/')).equal('/abc/');;
      //);

    });

    describe("#include", function(){
      //its(
      Should(makeCode('//#include /macro/test/unit/make/inc/hello.js')).equal('hello');;
      Should(makeCode('//#include /macro/test/unit/make/inc/hello.js\n//#include /macro/test/unit/make/inc/hello.js')).equal('hello');;
      Should(makeCode('//#include /macro/test/unit/make/inc/hello.js\n//#include! /macro/test/unit/make/inc/hello.js')).equal('hellohello');;

      Should(makeCode('/*#include /macro/test/unit/make/inc/hello.js*/')).equal('hello');;
      Should(makeCode('/*#include /macro/test/unit/make/inc/hello.js*/\n/*#include /macro/test/unit/make/inc/hello.js*/')).equal('hello');;
      Should(makeCode('/*#include /macro/test/unit/make/inc/hello.js*/\n/*#include! /macro/test/unit/make/inc/hello.js*/')).equal('hellohello');;
      //);
    });

    describe("#define macro", function(){
      //its(
      Should(makeCode('//#define x 123\nx')).equal('123');;
      Should(makeCode('/*#define x 123*/x')).equal('123');;
      Should(makeCode('/*#define x 123*/\nx')).equal('123');;

      Should(makeCode('//#define max(a, b) (a>b?a:b)\nmax(x, 5)')).equal('(x>5?x:5)');;
      Should(makeCode('/*#define max(a, b) (a>b?a:b)*/max(x, 5)')).equal('(x>5?x:5)');;
      Should(makeCode('/*#define max(a, b) (a>b?a:b)*/\nmax(x, 5)')).equal('(x>5?x:5)');;

      //);
    });

    describe("#define regexp", function(){
      //its(
      Should(makeCode('//#define b /\\s*/\n/<b>/')).equal('/\\s*/');;
      Should(makeCode('/*#define b /\\s+/*//<b>/')).equal('/\\s+/');;
      Should(makeCode('/*#define b /\\s+/*/\n/<b>/')).equal('/\\s+/');;
      //);
    });

    describe("denote code", function(){
      //its(
      Should(makeCode('/*//*/')).equal('//');;
      Should(makeCode('/*//*/hello')).equal('//hello');;
      Should(makeCode('/*//!*/hello')).equal('');;
      //);
    });
  });
});
