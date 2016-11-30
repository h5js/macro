/**
 * Eval(env)
 *    创建指定环境的 eval 函数。
 */

var Eval = func((0,eval)(
  //@formatter:off
    '(function(){'+
      'with(this){'+          //饱受争议的with语句（ECA7仍然支持with语句，至少5年内没问题）
        'return function(){'+
          '"use strict";'+
          'return eval([].pop.call(arguments))'+  //邪恶函数eval(), 清空参数以策安全
        '}'+
      '}'+
    '})'
    //@formatter:on
));