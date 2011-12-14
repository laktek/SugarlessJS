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

  it("should use fallback if its given", function(){
    expect(Sugarless(null, {fallback: "ok"})(function(){ return this})).toEqual("ok");
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

  it("should not execute the next context queue if there's a running context queue for an object", function(){
    var obj = {};
    Sugarless(obj)( function(){ Sugarless(this).next(); }, function(){ } );
    expect(Sugarless(obj)(function(){ return "next block"; })).not.toEqual("next block");
  });

});

describe("calling next", function(){

  it("should pop the next function in queue", function(){
    var result = "";
    var second_func = function(){ return "second" };
    Sugarless({})(function(){ result = Sugarless(this).next()(); }, second_func);

    expect(result).toEqual("second");
  });

  it("will not return the value of the function", function(){
    expect(Sugarless({})( function(){ Sugarless(this).next(); return "first" }, function(){ return "second"; })).not.toEqual("first");
  });

  it("will not execute the next function afterwards", function(){
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

  it("raises an exception if there are no functions in the queue", function(){
    expect( function(){ Sugarless({})( function(){ Sugarless(this).next() } );} ).toThrow("no function to run");
  });

});

describe("calling done", function(){
  it("decrements the running functions count", function(){
    expect( Sugarless({})( function(){  }, function(){  }, function(){ Sugarless(this).done(); return Sugarless(this).get('_running')  } ) ).toEqual(1);
  }); 

  it("shouldn't set a negative value to running functions count", function(){
    expect( Sugarless({})( function(){ Sugarless(this).done(); return Sugarless(this).get('_running') } ) ).toEqual(0);
  });

  it("calls the after function when there are no running functions", function(){
    var after_func = function(){ return "after" }
    expect( Sugarless({}, {after: after_func})( 
            function(){  }, function(){  }, 
            function(){ Sugarless(this).done(); Sugarless(this).done(); return "finished" } ) ).toEqual("after");
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

  it("should return the set value", function(){
    expect(Sugarless({})(function(){ return Sugarless(this).set("test", "value") })).toEqual("value");
  });

  it("should get the previously set value", function(){
    expect(Sugarless({})(function(){ Sugarless(this).set("test", "value") }, function(){ return Sugarless(this).get("test") })).toEqual("value");
  });

  it("should be possible to get and set at the top level", function(){
    expect(Sugarless({}, {noreturn: true})( Sugarless.set, "test", "value", Sugarless.get, "test" )).toEqual("value");
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
    var before_func = function(){ return Sugarless(this).next(); };

    expect(Sugarless({}, {before: before_func})(function(){ return "test" })).not.toEqual("test");
  });

});

describe("after callback", function(){

  it("excutes after all other functions are completed", function(){
    var after_func = function(){ return "after"; };

    expect(Sugarless({}, {after: after_func})(function(){ return "body"; })).toEqual("after");
  });

  it("will not exectue if there are pending functions"), function(){
    var after_func = function(){ return "after"; };
    Sugarless({}, {after: after_func})( function(){ }).not.toEqual("after"); 
  }

  it("should have reference to this", function(){
    var obj = {};
    var after_func = function(){ return this; };

    expect(Sugarless(obj, {after: after_func})( function(){ return "test" })).toBe(obj);
  });

  it("should receive the result of last function as an argument (if available)", function(){
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

  it("supports recursion", function(){
    var result = null;

    var sayItFor = function(count){
      var callback = Sugarless(this).next();
      var _sayItFor = function(c){
        if(c === 0){
          callback(Sugarless(this).get('msg'));
        }
        else {
          var msg = Sugarless(this).get('msg') || [];
          Sugarless(this).set('msg', msg.concat(this) );
          _sayItFor.call(this, --c) 
        }
      }
      _sayItFor.call(this, count);
      
      // if(count === 0){
      //   Sugarless(this).next()(Sugarless(this).get('msg'));
      // }
      // else {
      //   var msg = Sugarless(this).get('msg') || [];
      //   Sugarless(this).set('msg', msg.concat(this) );
      //   Sugarless(this).recurse(--count); 
      // }
    };

    var sayGoodBye = function(){
      var msg = Sugarless(this).get('msg') || [];
      Sugarless(this).set('msg', msg.concat(["Good bye!"]));
      Sugarless(this).done();
    };

    Sugarless("Hello", { after: function(){ result = Sugarless(this).get('msg').join(" "); } })(
       sayItFor, 5 
     , sayGoodBye
    );

    waitsFor(function() {
      return result;
    }, "result never returned", 1000);

    runs(function () {
      expect(result).toEqual("Hello Hello Hello Hello Hello Good bye!");
    });
     
  });

  it("works with the strict mode", function(){
    "use strict";
    var strict_func = function(){ return "strict mode" }
    expect(Sugarless({})( strict_func )).toEqual("strict mode"); 
  });

})

