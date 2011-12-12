describe("initating Sugarless", function() {

  it("should accept an object", function() {
    expect(Sugarless("test")).toBeDefined();
  });

  it("should accept optional parameters", function(){
    expect(Sugarless("test"), {defaultObj: ""}).toBeDefined();
  });

  it("should return a function", function(){
    expect(typeof Sugarless("test")).toEqual("function");
  });

});

describe("dealing with null objects", function() {
 
  it("should return null when no default", function() {
    expect(Sugarless(null)(function(){ return "ok"})).toBeNull();
  });

  it("should use default if its given", function(){
    expect(Sugarless(null, {defaultObj: "ok"})(function(){ return this})).toEqual("ok");
  });

});

describe("normal flow", function(){

  it("should raise an excpetion if no functions were passed", function() {
    expect(function(){ Sugarless({})("no func")}).toThrow();
  });

  it("should accept array of functions", function(){
    expect(Sugarless({})([function(){ return "a" }, function(){ return "b" }])).toEqual("b");
  });

  it("should set this of the function to passed object", function(){
    var passed_obj = {"a": "b"}; 
    expect(Sugarless(passed_obj)(function(){ return this; })).toBe(passed_obj);
  });

  it("should pass the default arguments to the function", function(){
    expect(Sugarless({})(function(){ return arguments[0] + " " + arguments[1] }, "one", "two")).toEqual("one two");
  });

  it("should return the last returned result as the final result", function(){
    expect(Sugarless({})(function(){ return "a" }, function(){ return "b" })).toEqual("b");
  });

  it("should pass the result of previous function to the next", function(){
    expect(Sugarless({})(function(){ return "a" }, function(){ var val = arguments[0]; return val; })).toEqual("a");
  });

  it("should queue the functions", function(){
    var obj = {};
    Sugarless(obj)( function(){ Sugarless(this).next(); }, function(){ } );
    expect(Sugarless(obj)(function(){ return "next block"; })).not.toEqual("next block");
  });

});

describe("controlling the flow with next", function(){

  it("should pop the next function in queue", function(){
    var result = "";
    var second_func = function(){ return "second" };
    Sugarless({})(function(){ result = Sugarless(this).next()(); }, second_func);

    expect(result).toEqual("second");
  });

  it("will not execute the next function if the previous function pops it", function(){
    expect(Sugarless({})( function(){ Sugarless(this).next(); }, function(){ return "second"; })).toBeUndefined();
  });

  it("should bind reference of this to the next function", function(){
    var obj = {"a": "b"}; 
    var second_func = function(){ return this };
    
    expect(Sugarless(obj)(function(){ return Sugarless(this).next()(); }, second_func)).toBe(obj);
  });

  it("should pass the default arguments to the next function", function(){
    var second_func = function(){ return arguments[0] };
    
    expect(Sugarless({})(function(){ return Sugarless(this).next()(); }, second_func, "test arg")).toEqual("test arg");
  });

  it("should override default arguments with the passed arguments", function(){
    var second_func = function(){ return arguments[0] };
    
    expect(Sugarless({})(function(){ return Sugarless(this).next()("callback arg"); }, second_func, "original arg")).toEqual("callback arg");
  });

  it("should be possible to access default arguments if they were not overwritten", function(){
    var second_func = function(){ return arguments[1] };
    
    expect(Sugarless({})(function(){ return Sugarless(this).next()("callback arg"); }, second_func,  "original arg", "secondary arg")).toEqual("secondary arg");
  });

  it("calling next when no functions in the queue raises an exception", function(){
    expect( function(){ Sugarless({})( function(){ Sugarless(this).next() } );} ).toThrow("no function to run");
  });

});

describe("calling clear", function(){
  it("should not execute the next function in queue", function(){
    expect( Sugarless({})( function(){ Sugarless(this).clear(); }, function(){ return "next result"} ) ).not.toEqual("next result");
  });

  it("should clear the function queue", function(){
    var obj = {};
    Sugarless(obj)( function(){ Sugarless(this).next(); Sugarless(this).clear(); }, function(){ }, function(){ } );
    expect(Sugarless(obj)(function(){ return "next block"; })).toEqual("next block");
  });

  it("should not affect the execution of current function", function(){
    expect( Sugarless({})( function(){ Sugarless(this).clear(); return "current result" }, function(){ return "next result"} ) ).toEqual("current result");
  });
});

describe("getters and setters for context", function(){

  it("should get the previously set value", function(){
    expect(Sugarless({})(function(){ Sugarless(this).set("test", "value") }, function(){ return Sugarless(this).get("test") })).toEqual("value");
  });

  it("should be possible to get and set at the top level", function(){
    expect(Sugarless({})( Sugarless.set, "test", "value", Sugarless.get, "test" )).toEqual("value");
  });

  it("should throw an error when property to get is not defined", function(){
    expect(function(){ Sugarless({})( Sugarless.get )}).toThrow();
  });

  it("should throw an error when property to set is not defined", function(){
    expect(function(){ Sugarless({})( Sugarless.set )}).toThrow();
  });

});

describe("with noreturn option", function(){
  it("shouldn't pass the result of previous function to the next", function(){
    var second_func = function(){ return arguments[0] };
    
    expect(Sugarless({}, { noreturn: true })(function(){ return Sugarless(this).next()("callback arg"); }, second_func, "original arg")).toEqual("original arg");
  })
})

describe("before callback", function(){

  it("excutes before all other functions", function(){
    var result = "";
    var before_func = function(){ result = "before"; return null; };

    expect(Sugarless({}, {before: before_func})(function(){ return result; })).toEqual("before");
  });

  it("should have reference to this", function(){
    var obj = {};
    var before_func = function(){ return this; };

    expect(Sugarless(obj, {before: before_func})()).toBe(obj);
  });

  it("passes the result to the first function as an argument", function(){
    var before_func = function(){ return "before"; };

    expect(Sugarless({}, {before: before_func})(function(){ var val = arguments[0]; return val })).toEqual("before");
  });

  it("can pop next function in queue", function(){
    var before_func = function(){ return Sugarless(this).next(); };

    expect(Sugarless({}, {before: before_func})(function(){ return "test" })).not.toEqual("test");
  });

});

describe("after callback", function(){

  it("excutes after all other functions", function(){
    var after_func = function(){ return "after"; };

    expect(Sugarless({}, {after: after_func})(function(){ return "body"; })).toEqual("after");
  });

  it("should have reference to this", function(){
    var obj = {};
    var after_func = function(){ return this; };

    expect(Sugarless(obj, {after: after_func})()).toBe(obj);
  });

  it("should receive the result of last function as an argument", function(){
    var obj = {};
    var after_func = function(){ var val = arguments[0]; return val + " after"; };

    expect(Sugarless({}, {after: after_func})(function(){ return "body" })).toEqual("body after");
  });

});

describe("handling exceptions", function(){
  it("should call error handler when an exception is throwed", function(){
    var error_func = function(){ return "error occurred"; };

    expect(Sugarless({}, {error: error_func})( function(){ throw "An error" })).toEqual("error occurred");
  });

  it("should throw the exception normally, if no error handler is defined", function(){
    expect(function(){ Sugarless({})( function(){ throw "An error" }) }).toThrow("An error");
  });

});

describe("using Sugarless invoke", function(){
  it("invokes the method with arguments given on the passing object", function(){
    expect(Sugarless.invoke.call("Test", "charAt", 1)).toEqual("e") 
  });

  it("it can take arguments as an array", function(){
    expect(Sugarless.invoke.call("Test", ["charAt", 1])).toEqual("e") 
  });

  it("inside the Sugarless block", function(){
    expect(Sugarless("Test")( Sugarless.invoke, "charAt", 1)).toEqual("e") 
  });

});

describe("some more nice things", function(){
  it("aliasing", function(){
    var awesomeWrapper = Sugarless({}, {before: function(){ return "awesome" }}); 
    
    expect(awesomeWrapper( function(){ var val = arguments[0]; return val })).toEqual("awesome"); 
  });

  it("enumerable wrapper", function(){
   var addOne = function(){ var val = this; return ++val; };  
   var multiplyByTwo = function(){ var val = arguments[0]; return val * 2; };  
   var substractOne = function(){ var val = arguments[0]; return --val; };

   var map = function(){ 
     var obj = Array.prototype.shift.call(arguments);   
     var args = Array.prototype.slice.call(arguments);
     var results = [];
   
     for(var i = 0; i < obj.length; i++){
        results[i] = Sugarless(obj[i])(args); 
     }

     return results;
   }

   expect( 
     map([1, 2, 3, 4],
         addOne
       , multiplyByTwo
       , substractOne
     )
   ).toEqual([3, 5, 7, 9]); 
  });

  it("works with the strict mode", function(){
    "use strict";
    var strict_func = function(){ return "strict mode" }
    expect(Sugarless({})( strict_func )).toEqual("strict mode"); 
  });

})

