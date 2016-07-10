describe('purl.js', function(){
  describe('purl()', function(){
    var home, abs, abs_path, rel_path;
    //its(
    home = purl("http://www.h5js.com/a/b/c/index.html");;;
    Should(home).equal("http://www.h5js.com/a/b/c/index.html");;
    abs = purl("https://www.h5js.cn/x/y/z/abs.js", home);;
    Should(abs).equal("https://www.h5js.cn/x/y/z/abs.js");;
    abs_path = purl("/x/y/z/file", home);;
    Should(abs_path).equal("http://www.h5js.com/x/y/z/file");;
    rel_path = purl("./x/y/z/.././../file.xml", home);;
    Should(rel_path).equal("http://www.h5js.com/a/b/c/x/file.xml");;

    home = purl("http://www.h5js.com/a/b/c/index.html?a=1&b=2");;
    Should(home).equal("http://www.h5js.com/a/b/c/index.html");;
    abs = purl("https://www.h5js.cn/x/y/z/abs.js?a=1&b=2", home);;
    Should(abs).equal("https://www.h5js.cn/x/y/z/abs.js");;
    abs_path = purl("/x/y/z/file?a=1&b=2", home);;
    Should(abs_path).equal("http://www.h5js.com/x/y/z/file");;
    rel_path = purl("./x/y/z/.././../file.xml?a=1&b=2", home);;
    Should(rel_path).equal("http://www.h5js.com/a/b/c/x/file.xml");;

    home = purl("http://www.h5js.com/a/b/c/index.html#a=1&b=2");;
    Should(home).equal("http://www.h5js.com/a/b/c/index.html");;
    abs = purl("https://www.h5js.cn/x/y/z/abs.js#a=1&b=2", home);;
    Should(abs).equal("https://www.h5js.cn/x/y/z/abs.js");;
    abs_path = purl("/x/y/z/file#a=1&b=2", home);;
    Should(abs_path).equal("http://www.h5js.com/x/y/z/file");;
    rel_path = purl("./x/y/z/.././../file.xml#a=1&b=2", home);;
    Should(rel_path).equal("http://www.h5js.com/a/b/c/x/file.xml");;

    home = purl("http://www.h5js.com/a/b/c/index.html?A=1&B=2#a=1&b=2");;
    Should(home).equal("http://www.h5js.com/a/b/c/index.html");;
    abs = purl("https://www.h5js.cn/x/y/z/abs.js?A=1&B=2#a=1&b=2", home);;
    Should(abs).equal("https://www.h5js.cn/x/y/z/abs.js");;
    abs_path = purl("/x/y/z/file?A=1&B=2#a=1&b=2", home);;
    Should(abs_path).equal("http://www.h5js.com/x/y/z/file");;
    rel_path = purl("./x/y/z/.././../file.xml?A=1&B=2#a=1&b=2", home);;
    Should(rel_path).equal("http://www.h5js.com/a/b/c/x/file.xml");;
    //);
  });
});

