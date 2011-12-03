describe("initating Sugarless", function() {

  it("should accept an object", function() {
    expect(Sugarless("test")).toBeDefined();
  });

  it("should accept optional parameters", function(){
    expect(Sugarless("test"), {defaultObj: ""}).toBeDefined();
  });

  it("should throw an exception if called without an object", function(){
   expect(function(){ Sugarless() }).toThrow(); 
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

describe("handling of the functions", function(){

  it("should raise an excpetion if no functions were passed", function() {
    expect(function(){ Sugarless({})("no func")}).toThrow();
  });

  it("should set this of the function to passed object", function(){
    var passed_obj = {"a": "b"}; 
    expect(Sugarless(passed_obj)(function(){ return this; })).toBe(passed_obj);
  });

  it("should pass the given parameters to the function", function(){
    expect(Sugarless({})(function(){ return arguments[0] + " " + arguments[1] }, "one", "two")).toEqual("one two");
  });

  it("should return the last functions result as the final result", function(){
    expect(Sugarless({})(function(){ return "a" }, function(){ return "b" })).toEqual("b");
  });

  it("should pass the result of previous function to the next", function(){
    expect(Sugarless({})(function(){ return "a" }, function(){ var val = arguments[0]; return val; })).toEqual("a");
  });

  it("should get the next function in queue", function(){
    var result = "";
    var second_func = function(){ return "second" };
    Sugarless({})(function(){ result = Sugarless.next(this)(); }, second_func);

    expect(result).toEqual("second");
  });

  it("should bind reference of this to the next function", function(){
    var obj = {"a": "b"}; 
    var second_func = function(){ return this };
    
    expect(Sugarless(obj)(function(){ return Sugarless.next(this)(); }, second_func)).toBe(obj);
  });

  it("should pass the originally declared arguments to the next function", function(){
    var second_func = function(){ return arguments[0] };
    
    expect(Sugarless({})(function(){ return Sugarless.next(this)(); }, second_func, "test arg")).toEqual("test arg");
  });

  it("should give prcedence to arguments passed in the callback over original arguments", function(){
    var second_func = function(){ return arguments[0] };
    
    expect(Sugarless({})(function(){ return Sugarless.next(this)("callback arg"); }, second_func, "original arg")).toEqual("callback arg");
  });

  it("should be possible to access original arguments when callback arguments are defined", function(){
    var second_func = function(){ return arguments[1] };
    
    expect(Sugarless({})(function(){ return Sugarless.next(this)("callback arg"); }, second_func, "original arg")).toEqual("original arg");
  });

  it("will not execute the next function if the previous function doesn't return", function(){
    expect(Sugarless({})( function(){ result = "first"; }, function(){ return "second"; })).toBeUndefined();
  });

  it("calling next when no functions in the queue raises an exception", function(){
    expect( function(){ Sugarless({})( function(){ Sugarless.next(this) } );} ).toThrow("no function to run");
  });

  it("should queue the functions", function(){
    var obj = {};
    Sugarless(obj)( function(){ /* doesn't return or calls next */ }, function(){ } );
    expect(Sugarless(obj)(function(){ return "next block"; })).not.toEqual("next block");
  });

  it("should accept functions as an array", function(){
    expect(Sugarless({})([function(){ return "a" }, function(){ return "b" }])).toEqual("b");
  });

});

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
    var before_func = function(){ return Sugarless.next(this); };

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

  it("should throw the exception if no error handler is defined", function(){
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

describe("some nice things", function(){
  it("simple alias", function(){
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

})

