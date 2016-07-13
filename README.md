# macro.js
macro.js将带宏指令的JavaScript源代码编译成标准的JavaScript代码。通过JavaScript宏指令, 可以很容易将代码片段组织成整个文件, 还可以编写更加易于理解的程序代码。  

## 一. 用法
### 浏览器环境
```javascript
<script src="macro.js" macro="file1.js; file2.js; ... fileN.js">
...     //任意带宏指令的JavaScript代码
</script>
```
其中，&lt;script&gt;的macro属性指定的每一个带宏命令的JS文件，将依次被编译和执行。而且，如果&lt;script&gt;标签中包含代码，则也将在最后被编译和执行。  

## 二. 宏指令
## 包含
包含指令用于在当前代码块中引入指定文件的外部代码块:
```javascript
/*[ ]#include[!] filename [comment]*/  
//[ ]#include[!] filename [comment]
```
若在注释引导符("/\*"或"//")与#include之间有空格, 则引入的代码块会按注释引导符前面的空格自动缩进引入代码.  
默认情况下, 每个代码文件块只会被包含一次. 但是, 若紧接#include之后有叹号("!"), 则如果文件的代码块会在该处再重复引入一次.

### 定义
定义指令用于定义宏常量或宏函数:
```javascript
/*#define name[(parameters)] body */  
//#define name[(parameters)] body  
```
宏定义只是简单的源代码替换逻辑. 一旦定义了宏的 name 和 body, 后续代码的中匹配该 name 的标示符将被替换成 body 中的代码. 带参数的宏实际上是一个源代码替换模板, 替换时用实际参数来实例化模板形成要替换的源代码.  
 

### 行注释
行注释指令用于以注释或删除一行代码:
```javascript
/*//[!] [comment]*/ any source code line
```
若"//"后紧跟一个"!", 则删除从该指令处至行尾的代码, 否则只是注释掉行尾的代码. 

### 块注释
块注释指令是一对, 用于注释代码块:
```javascript
/*{[!] [comment]\*/
any source code block ...
/*} [comment]\*/
```
若"{"后紧跟一个"!", 则删除从该代码块, 否则只是注释掉该代码块. 若"/\*{\*/"没有匹配的"/\*}\*/", 则将删除或注释掉从"/\*{\*/"至该代码文件结束的所有代码. 

### 正则宏
可以用#define指令定义正则表达式的宏：
```javascript
/*#define name regular-express */
//#define name regular-express
```
之后，正则表达式中可以用 &lt;name&gt; 来表示宏，其将被替换成正则宏的内容。  
