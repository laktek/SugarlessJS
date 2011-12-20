SugarlessJS: Functional & Context Oriented way to write JavaScript
====================================================================

Sugarless is a small utility library that gives you a powerful new way express your JavaScript code. Rather than thinking in terms of Objects and their methods, Sugarless let's you think in terms of contexts and invoke functions based on the context. 

It's a pure JavaScript library and can be used almost anywhere (in any platform, browser or library). No pre-compilations or other dependencies involved.

A Quick Example
------------

  ```javascript

  // Common way 
  truncate(trim(sanitize(user_input)), 200)
  
  // Sugarless way
  Sugarless(user_input)(
    sanitize          
   ,trim             
   ,truncate, "", 200   
  )
  ```

Main Features
-------------

* Context can be any JavaScript object (host or user-defined) or a primitive value (primitive values will be converted to objects).

* All functions in a given context are invoked with `this` value set to the context.

* When evaluating a context queue, return value of one function will be passed on to the next function in the queue as the first argument. 
  Last function's return value will be the final result. 

  ```javascript
    var $_ = Sugarless; //let's define a shorthand

    var output = $_({ title: "The Lord of the Rings", sold_copies: 150000000 })(

        function(){ this.author = "J.R.R.Tolkien" } // this refers to the context
      , function(){ return (this.sold_copies > 100000) ? "bestseller" : "average" } // passes the result to the next function
      , function(type) { return this.title + " by " + this.author + " is a " + type }  // returned as the final result

    );

    console.log(output)

    // http://jsbin.com/izunot/edit#source
  ```

* You can provide a list of default arguments to be passed on to a function.
  Keep in mind that the return value (or callback) of the previous function will override the default arguments.

  ```javascript
    var concat = function(stem, sub){ return (stem || this) + " " +sub }

    var output = $_("This")(
                    concat, null, "is"        // forces to use context as the stem
                  , concat, "", "a"           // pass in a placeholder argument for stem 
                  , concat, "", "sentence"
                 );

    console.log(output);

    // http://jsbin.com/akibac/edit#source
  ```

What if the functions in the queue runs asynchrnously? One way to handle asynchrnous flow is to use `sugarless.next()` method. Calling it will halt the sequential evaluation of the context queue and returns the next function in the queue. You can use the function returned, as a callback for an asynchrnous call. 

  ```javascript
    $_({})(
       function(){ setTimeout($_(this).next(), 60) }
     , function() { console.log("second function") }
     , function() { console.log("third function") }
    )

    // http://jsbin.com/eruwuk/edit#source
  ```

* Also, you can invoke several asynchronous functions parallely and use `after` callback to do a final evaluation under the context. You can mark the completion of a asynchrnous function with `sugarless.done()`. 

  ```javascript
    $_({}, {after: function(){ console.log('Finished running all functions')}})(
        function() { var self = this; setTimeout(function(){ $_(self).done() }, 180) }
    ,   function() { var self = this; setTimeout(function(){ $_(self).done() }, 20) }
    ,   function() { var self = this; setTimeout(function(){ $_(self).done() }, 60) }
    );

    // http://jsbin.com/eliwux/edit#source 
  ```

* Rather than cascading to the next function in the queue, you can recursively invoke the current function by calling `sugarless.recurse()`.  

  ```javascript
  var copy_array = function(params){ 
    if(params.length){
      this.push(params.shift());
      $_(this).recurse(params);
    }
    else {
      $_(this).done();
    }
  };

  ($_([])(
    copy_array, ["one", "two", "three"]
  , function(){ console.log(this); }
  );
  ```

* If the you pass a null or undefined context, Sugarless will return null without executing any given function.

  ```javascript
  var awesome_value = $_(null)(
    function(){
      return this + " is awesome"
    }
  );

  console.log(awesome_value) //null

  // http://jsbin.com/izohuy/edit#source
  ```

* You can pass-in a optional `fallback` context (a function or an object) in case of default context is undefined or null.

  ```javascript
  var awesome_value = $_(null, {fallback: function(){ return "simple"} })(
    function(){
      return this + " is awesome"
    }
  );

  console.log(awesome_value) //simple is awesome

  // http://jsbin.com/isiwag/edit#source
  ```

* You can provide callbacks to `before` and `after` the context queue. Useful when you want to write wrappers with Sugarless.

  ```javascript
   var user_name = "John";
   var user_age = 25

   $_(user_name, 
     {
       before: function(){ return {name: this} },  //returns a new object wrapping the context
       after: function(obj){ console.log(obj.name + " is " + obj.age + " old."); } 
     }
    )(
     function(obj){ obj.age = user_age; return obj; }
   , function(obj){ console.log(obj.name); $_(this).done(obj); }
  );

  // http://jsbin.com/igupir/edit#source
  ```

  Note: `after` callback will only invoke if all functions in the given context finish execution. Returning a value will automatically marks a function as executed. If a function returns nothing, you need to explicitly call `sugarless.done()` to mark the function as executed.

* You can provide an optional `error` function to handle exceptions that occurs in context queue.

  ```javascript
  $_({}, {error: function(){ console.log("An error occurred.") } })(
    function(){
      throw "Bad Error";
    }
  );

  // http://jsbin.com/efakij/edit#source
  ```
Installation
------------

You can install Sugarless via NPM.

  ```bash
  npm install sugarless

  ```
Alternatively, you can download Sugarless from here - https://github.com/laktek/SugarlessJS/downloads
Extract the files and copy 'minified/sugarless.min.js' to your project.

FAQ
---

* Why the name Sugarless?

  <del>It won't use a sugar coating to hide the original problem from you.</del> 

  Actually, I coded the initial concept while listening to this catchy tune: http://www.youtube.com/watch?v=mj2n-xrwOo0

* Can I use Sugarless with NodeJS?
  
  Yes. Sugarless is available as an NPM package. Also, check the sample node.js server written using Sugarless in examples. 

* How large is Sugarless?

  Sugarless is a fairly small library. The minified version is 2.64KB (1.04KB gzipped)

* Before getting started with Sugarless I want to getter bettet grip with Functional programming concepts in JavaScript. Where should I look?
  
  Eloquent JavaScript's chapter on Functional Programming is pretty comprehensive, a recommended read - http://eloquentjavascript.net/chapter6.html

Issues & Suggestions
--------------------
Please report any bugs or feature requests here:
http://github.com/laktek/SugarlessJS/issues/
