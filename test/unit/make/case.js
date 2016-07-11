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

    describe("#define", function(){
      var src, des;
      //its(
      src = '//#define x 123\nx';;
      Should(makeCode(src)).equal('123');;
      src = '/*#define x 123*/x';;
      Should(makeCode(src)).equal('123');;
      src = '/*#define x 123*/\nx';;
      Should(makeCode(src)).equal('123');;
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
