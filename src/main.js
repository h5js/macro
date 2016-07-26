/**
 * main.js
 */

var home = purl(location.toString());

var script = document.scripts;
script = script[script.length - 1];
var reUrls = /\s*[,;]\s*|^\s*|\s*$/;
var hasCode = reUrls.test.bind(/\S/);

var fixes = [], urls, url, i, code;

if (urls = script.getAttribute('fix')) {
  urls = urls.split(reUrls);
  for (i = 0; i < urls.length; i++)
    if (url = urls[i]) {
      url = purl(url, home);
      code = make(url);
      code += '\n//# sourceURL=' + url;
      fix = window.eval(code);
      if (typeof fix == 'function') {
        fixes.push(fix);
      }
    }
}

if(urls = script.getAttribute('macro')) {
  urls = script.getAttribute('macro').split(reUrls);
  var included = {}, defined = {};
  for (i = 0; i < urls.length; i++)
    if (url = urls[i]) {
      url = purl(url, home);
      code = make(url, included, defined);
      code = fixing(code);
      code += '\n//# sourceURL=' + url;
      window.eval(code);
    }
}

code = script.text;
var run = /^\s*\/\/#run\b/.test(code);

code = makeCode(code);
code = fixing(code);
script.text = code;

if(run) {
  if (url = script.getAttribute('name')) {
    code += '\n//# sourceURL=' + purl(url, home + '/');
  }
  window.eval(code);
}

function fixing(code) {
  var i, fix;
  for(i=0; i<fixes.length; i++) {
    fix = fixes[i];
    fix = fix(code);
    if(hasCode(fix)) {
      code = fix;
    }
  }
  return code;
}

