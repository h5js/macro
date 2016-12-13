var JS = `
#Script?:
  ScriptBody?

ScriptBody:
  StatementList
  
StatementList:
  StatementListItem+

StatementListItem:
  Statement
  Declaration

#Statement:
  EmptyStatement
  BlockStatement
  
EmptyStatement: /;/
  
BlockStatement:
  Block

#Block: /\\{/ StatementList? /\\}/

#Block2: /\\{/ StatementList? /\\}/

#Declaration:
  LexicalDeclaration

LexicalDeclaration:
  LetOrConst /\\s+/ BindingList /;/

LetOrConst:
  /\\blet\\b/
  /\\bconst\\b/

BindingList:
  LexicalBinding LexicalBindingEtc?
  
LexicalBindingEtc:
  /,/ LexicalBinding

LexicalBinding:
  BindingIdentifier Initializer?

BindingIdentifier:
  Identifier

Initializer:
  /=/ AssignmentExpression

AssignmentExpression:
  Number
  String

#Number: /\\d+(?:\\.\\d+)?/

#String:
  /'(?:[^'\\\\\\n\\r\\u2028\\u2029]|\\\\(?:.|[\\n\\u2028\\u2029]|\\r\\n?))*'/
  /"(?:[^"\\\\\\n\\r\\u2028\\u2029]|\\\\(?:.|[\\n\\u2028\\u2029]|\\r\\n?))*"/
  
#Identifier: /[a-zA-Z_$][\\w$]*/
`;

describe('parse.js', function(){
  grammar();
  testMacroParse();
  var js, template;
  describe('Grammar parsing:', function(){
    describe('Circle grammar:', function(){
    });

    describe('JavaScript:', function(){
      //its(
      debugger;;
      js = Parse(JS);;
      debugger;;
      Should(js).Function;;
      //);
    });

  });

  describe('Terminals:', function(){
    describe('Number', function(){
      var ast;
      //its(
      ast = js('123', 'Number');;
      Should(ast.t).equal('Number');;
      Should(ast.l).equal(1);;
      Should(ast[0]).equal('123');;
      js('abc', 'Number').should.throw('Syntax error: abc');;
      js('123?', 'Number').should.throw('Syntax error: ?');;
      //);
    });

    describe('String', function(){
      var ast;
      //its(
      js('', 'String').should.throw('Syntax error: <EOF>');;
      ast = js('"hello world"', 'String');;
      Should(ast.t).equal("String");;
      Should(ast[0]).equal('"hello world"');;
      ast = js("'hello world'", 'String');;
      Should(ast.t).equal("String");;
      Should(ast[0]).equal("'hello world'");;
      js('123', 'String').should.throw('Syntax error: 123');;
      //);
    });

    describe('Identifier', function(){
      var ast;
      //its(
      ast = js('abc', 'Identifier');;
      Should(ast.t).equal('Identifier');;
      Should(ast.l).equal(1);;
      Should(ast[0]).equal('abc');;
      js('012', 'Identifier').should.throw('Syntax error: 012');;
      js('abc?', 'Identifier').should.throw('Syntax error: ?');;
      //);
    });
  });

  describe('Nonterminals:', function(){
    var ast;
    //its(
    Should(js('')).equal(undefined);;
    ast = js('let x=123;');;
    ast = js(';let x=123;');;
    //console.log(ast);;
    //);
  });

});