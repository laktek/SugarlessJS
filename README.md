# SugarlessJS
### A Functional & Context Oriented way to write JavaScript

Sugarless is a small utility library that gives you a powerful new way to think and organize your JavaScript programs. Rather than Objects and methods, Sugarless focuses on Contexts and cascading behaviours. 

It's a pure JavaScript library and can be used in any platform, browser or library. No pre-compilers or other dependencies are needed.

Quick Example
---------------

  ```javascript

  // Common way 
  var output = truncate(trim(sanitize(user_input)), 200)
  
  // Sugarless way
  var output = Sugarless(user_input)(
    sanitize          
   ,trim             
   ,truncate, "", 200   
  );
  ```

Highlights
----------

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

    console.log(output); // The Lord of the Rings by J.R.R.Tolkien is a bestseller

  ```

* You can provide a list of default arguments to be passed on to a function.
  Note that the return value (or callback) of the previous function will override the default arguments. If you want to avoid this behaviour you can set the option `noreturn: true` for the context. 

  ```javascript
    var concat = function(stem, sub){ return (stem || this) + " " + sub }

    var output = $_("This")(
                    concat, null, "is"        // forces to use context as the stem
                  , concat, "", "a"           // pass in a placeholder argument for stem 
                  , concat, "", "sentence"
                 );

    console.log(output); // This is a sentence

  ```

* What if the functions in the queue runs asynchronously? One way to handle asynchronous flow is to use `sugarless.next()` method. Calling it will halt the sequential evaluation of the context queue and returns the next function in the queue. You can use the function returned, as a callback for an asynchronous call. 

  ```javascript
    $_({})(
       function(){ setTimeout($_(this).next(), 60) }
     , function() { console.log("second function") }
     , function() { console.log("third function") }
    );

  ```

* Also, you can invoke several asynchronous functions parallely and then use an `after` callback to do a final computation under the context. You can mark the completion of a asynchronous function with `sugarless.done()`. 

  ```javascript
    $_({}, {after: function(){ console.log('Finished running all functions')}})(
        function() { var self = this; setTimeout(function(){ $_(self).done() }, 180) }
    ,   function() { var self = this; setTimeout(function(){ $_(self).done() }, 20) }
    ,   function() { var self = this; setTimeout(function(){ $_(self).done() }, 60) }
    );

  ```

* Using `sugarless.recurse()` you can recursively call the current function. 
  By returning or calling `sugarless.done()` you can end recursion and move on to the next function in the queue. 

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

    $_([])(
      copy_array, ["one", "two", "three"]
    , function(){ console.log(this); }
    );

  ```

* Calling `sugarless.clear()` will clear the remaining functions in the queue and exit the context with the result of the current function.

  ```javascript
    $_({})(
      function(){ 
        console.log("This will be printed."); 
        if(true){
          $_(this).clear();
        }
      },
      function(){
        console.log("This will not be printed."); 
      }
    );

  ```

* Using `sugarless.set()` you can set properties for the current context. Using `sugarless.get()` you can retrive previously set properties. 

  ```javascript
    $_({})(
      function(){ 
        $_(this).set('score', 75); 
      },
      function(){
        console.log( $_(this).get('score') );  // 75
      }
    );

  ```

* If the context is null or undefined, Sugarless will return null without executing any function in the context queue.

  ```javascript
    var awesome_value = $_(null)(
      function(){
        return this + " is awesome"
      }
    );

    console.log(awesome_value); // null

  ```

* You can pass an optional `fallback` context (a function or an object) in case of default context is undefined or null.

  ```javascript
    var awesome_value = $_(null, {fallback: function(){ return "simple"} })(
      function(){
        return this + " is awesome"
      }
    );

    console.log(awesome_value); //simple is awesome

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

  ```

  Note: `after` callback will only invoke if all functions in the given context finish execution. Returning a value will automatically marks a function as executed. If a function returns nothing, you need to explicitly call `sugarless.done()` to mark the function as executed.

* You can provide an optional `error` function to handle exceptions that occurs in context queue.

  ```javascript
    $_({}, {error: function(){ console.log("An error occurred.") } })(
      function(){
        throw "Bad Error";
      }
    );

  ```

* If you want to invoke a member function of context's object (or available in it's prototype chain), you can use the shorthand function `Sugarless.invoke`. It takes the member function to be evaluated as a string and any number of arguments, which will be passed to the member function.

  ```javascript
    var magnitude = {name: "Magnitude", college: "Greendale CC", speak: function(){ return "POP! POP!" } };
    $_(magnitude)(
      $_.invoke, "speak" 
    , function(quote){ 
        console.log(this.name + " says " + quote); // Magnitude says POP! POP!
      }
    );
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

**Why the name Sugarless?**

<del>Because it won't use a sugar coating to hide the original problem from you.</del> 

_Actually, I coded the initial concept of this while listening to this catchy tune :) http://www.youtube.com/watch?v=mj2n-xrwOo0 _

**Can I use Sugarless with NodeJS?**
  
Yes. Sugarless is available as an NPM package. Also, check the sample node.js server written using Sugarless in examples. 

**How large is Sugarless? Does it have any dependencies?**

Sugarless is a fairly small, self-contained library. The minified version is **2.64KB (1.04KB gzipped)**.

**Can I use Sugarless in an existing project?**

Of course. You can start using Sugarless to refactor a section or to implement something new. Sugarless will not have any affect on your existing JavaScript code.
 
**Before getting started with Sugarless I want to get a better grip with Functional programming concepts in JavaScript. Where should I start?**
  
Eloquent JavaScript's chapter on Functional Programming is pretty comprehensive, a recommended read - http://eloquentjavascript.net/chapter6.html

Another good read is "Understanding JavaScript Function Invocation and 'this'" by Yehuda Katz - http://yehudakatz.com/2011/08/11/understanding-javascript-function-invocation-and-this/

Issues & Suggestions
--------------------

Please report any bugs or feature requests here:
http://github.com/laktek/SugarlessJS/issues/

