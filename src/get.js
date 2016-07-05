/**
 * get.js
 */

/**
 * get(url) 获取URL指定的文本。
 *
 * @param {string} url
 * @return {string}
 */
function get(url) {
  var http = new XMLHttpRequest;
  http.open('GET', url, false);
  http.send();
  return http.status / 100 ^ 2 ? '' : http.responseText;
}
