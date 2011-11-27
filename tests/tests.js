$(function(){

  test("initating", function() {
    ok(Sugarless("test"), "should be called with an object"); 
    ok(Sugarless("test", {default: ""}),"should accept optional parameters"); //find a better way to test
    raises(function(){ Sugarless() }, "throws exception if called without an object");
    equal(typeof Sugarless('test'), 'function', "should return a function")
  });

  test('dealing with null objects', function(){
    equal(Sugarless(null)(function(){ return "ok"}), null, "without a default")
    equal(Sugarless(null, {default: "ok"})(function(){ return this}), "ok", "with a default")
  });

  test("calling functions synchronously", function(){
    raises(function(){ Sugarless('test')('no func') }, "should at least provide one function");

    equal( Sugarless("test")(function(){ return this; }), "test", "this is set to the stemming object");

    equal( Sugarless("test")(function(){ return arguments[0] + " " + arguments[1]}, "one", "two"), "one two", "passes parameters passed after the function, to the function as arguments");

    equal( Sugarless("test")(function(){ return "a"}, function(){ return "b"}), "b", "last function's return value shall be the final result");

    equal( Sugarless("test")(function(){ return "a"}, function(){ return Sugarless.adhoc(this) }), "a", "previous function's return value shall be exposed to the next function via adhoc variable");

    equal( Sugarless("test")(function(){ return "a"}, function(){ Sugarless("test2")(function(){ return "b" }); return Sugarless.adhoc(this) }), "a", "should preserve outer scopes adhoc value")

    equal( Sugarless("test")(function(){ return "first" }, function(){ return Sugarless.adhoc(this) + " second"; }), "first second", "functions can be executed sequentially")

    output = null;
    Sugarless("test")(function(){ output = "first"; var later = Sugarless.next(this) }, function(){ output += " second" });
    equal( output, "first", "deferred function execution")

    output = null;
    Sugarless("test")(function(){ output = "first" }, function(){ output += " second"; var later = Sugarless.next(this) });
    equal( output, "first", "deferred function execution")

    var deferred_output = Sugarless("test")(function(){ var deferred_func = Sugarless.next(this); return deferred_func.call("test2") }, function(){ return this; });
    equal( deferred_output, "test", "deferred function should have reference original this");

    deferred_output = Sugarless("test")(function(){ var deferred_func = Sugarless.next(this); return deferred_func.call("test2", "arg") }, function(){ return arguments[0]; });
    equal( deferred_output, "arg", "deferred function should accept arguments from new context");

    deferred_output = Sugarless("test")(
                          function(){ var deferred_func = Sugarless.next(this); return deferred_func.call("test2", "arg") }
                        , function(){ return Array.prototype.pop.call(arguments); }, "original_arg"
                      );
    equal( deferred_output, ["original_arg"], "deferred function should also have access to original arguments");

  });

  test("calling functions asynchronously", function(){
  
  });

  test("before/after callbacks", function(){
    var output = Sugarless("test", {before: function(){ return "before"}, after: function(){ return Sugarless.adhoc(this) + " after" }})(function(){ return Sugarless.adhoc(this) + " body"});
    equal(output, "before body after", "executes before/after decorators");

    equal(Sugarless("test", {before: function(){ return this }})(function(){ return Sugarless.adhoc(this) }), "test", "callbacks has access to this")

  });



});

