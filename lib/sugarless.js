(function(root){

  var _objects = [];
  var _stack = []; //holds functions and error handlers

  var indexOf = function(obj, array){
    if(!Array.prototype.indexOf){
      for(var i=0; i<array.length; i++){
          if(array[i]===obj){
              return i;
          }
      }
      return -1;
    }
    else {
      return array.indexOf(obj); 
    }
  };

  var _getId = function(obj){
    //check whether the object is available in the objects 
    var obj_id = indexOf(obj, _objects);

    if(obj_id >= 0){
      return obj_id;
    }
    else {
      //push it to the objects array and return the id
      _objects[_objects.length] = obj;
      _stack[_stack.length] = { '_functions': [], '_error_handler': null, '_async': false, '_returns': false, '_running': 0 };

      return (_objects.length - 1); //return the object id
    }
  };

  var _removeObject = function(id){
    //remove object and it's values from the stack 
    _objects.splice(id, 1);
    _stack.splice(id, 1);
  };

  var _next = function(){
    var obj = arguments[0]; 
    var async = arguments[1] || false;

    var obj_id = _getId(obj);
    var stack = _stack[obj_id];
    var current_function_queue = stack['_functions'];

    //check the function length to set the next function
    if(typeof current_function_queue[0] === "function"){
      var next_func = current_function_queue.shift();
      var next_args = [];

      var extract_args = function(){
        if(current_function_queue.length && (typeof current_function_queue[0] !== "function")){
          next_args.push(current_function_queue.shift()); 
          extract_args();
        }
      };

      extract_args();

      return function(){
        if(async){
          //turn off the async flag
          stack['_async'] = false;
          //decrement the number of running functions
          stack['running']--
        }

        var passed_args = Array.prototype.slice.call(arguments);
        // modify the argument list with the passed arguments
        if(stack["_returns"]){
          for(var i=0; i < passed_args.length; i++){
           next_args[i] = passed_args[i] || next_args[i]; 
          } 
        }

        //wrap the function call with a try catch block if there's an error handler
        var error_handler = stack['_error_handler'];
        if(error_handler){
          try {
            var result = next_func.apply(obj, next_args);
          }
          catch(e) {
            return error_handler.call(obj, e);
          }
        }
        else {
          var result = next_func.apply(obj, next_args);
        }

        //handle the result if not async
        if(!stack['_async']){

          //if the result is undefined
          if(typeof result === "undefined"){
            //increment the number of running functions 
            stack['_running']++;
          }

          //check if more functions exist in the context queue
          if(current_function_queue.length){
            //call in the next function with the result
            return _next(obj)(result);
          }
          else {
            //no more functions in context queue

            //check if there's an after function defined
            if(stack['_after']){

              //check if there are still running functions
              if(stack['_running'] === 0){
                //no running functions
                result = stack['_after'].apply(obj, [result]);

                //end the object's lifecycle
                _removeObject(obj_id);
              }

            }
            else {
              //end the object's lifecycle
              _removeObject(obj_id);
            }

            //return the final result 
            return result;

          }

        }
      };    
    }
    else { 
      throw new Error("no function to run"); 
    }
  };

  var _clear = function(obj_id){
    //remove the remaining functions
    var functions = _stack[obj_id]['_functions'];
    functions.splice(0, functions.length);

    //reset the async flag
    _stack[obj_id]['_async'] = false;

  };

  var _done = function(obj, result){
    var obj_id = _getId(obj);
    var stack = _stack[obj_id];

    if(stack['_running'] > 0){
     if(--stack['_running'] == 0){
       //execute the after callback 
       stack['_after'].apply(obj, [result]);
     } 
    }
  };

  var _get = function(obj_id, property){
     if(property) {
      return _stack[obj_id][property];
     }
     else {
      throw new Error("property not given"); 
     }
  };

  var _set = function(obj_id, property, value){
    if(property) {
     _stack[obj_id][property] = value; 
    }
    else {
      throw new Error("property not given"); 
    }
  };

  var _sugarless = function(){
    //set the object
    var obj = arguments[0];
    
    // optional properties
    var opts = arguments[1] || {};
    var fallback = opts["fallback"] || null;
    var before_func = (typeof opts["before"] === "function") ? opts["before"] : null;
    var after_func = (typeof opts["after"] === "function") ? opts["after"] : null;
    var error_func = (typeof opts["error"] === "function") ? opts["error"] : null;
    var returns = !opts["noreturn"];

    //handle null & undefined objects  
    //we assume object is null if its result after type coercion evaluates to null
    //if we can find a fallback we set it as the object
    if(obj == null){
      // default value given 
      if(fallback){
        // check the typeof default value - if function take the return value else given value
        obj = (typeof fallabck === "function") ? fallback.call(obj) : fallback;
      }
      else {
        // no default value given, return null for function block
        return function(){ return null; };
      }
    }
 
    var context = function(){
      //this is the scope all passed-in functions will be executed

      //assigns the object id
      //if the object is not already in store it will be stored first.
      var obj_id = _getId(obj);
      var stack  = _stack[obj_id];

      //store the error handler
      stack['_error_handler'] = error_func;

      //store the after function
      stack['_after'] = after_func;

      //set the returns flag
      stack['_returns'] = returns;

      //reset the running count
      stack['_running'] = 0;

      var current_function_queue = stack['_functions'];

      //checks whether there is already a pending queue
      var is_empty_queue = !(current_function_queue.length || stack['_async']);

      //add the before filter
      if(before_func){
        current_function_queue.push(before_func);
      }

      //check if passed argument is an array
      var passed_args = (arguments.length === 1 && (typeof arguments[0] !== "function")) ? arguments[0] : Array.prototype.slice.call(arguments);   
      current_function_queue = current_function_queue.concat(passed_args); 

      stack['_functions'] = current_function_queue;

      //execute the first function (if there's no pending queue)
      if(is_empty_queue){
        return _next(obj)();
      }
    };

    //set a variable for the context
    context.set = function(property, value){
       _set(_getId(obj), property, value); 
    };

    //get the value of a variable available in the context
    context.get = function(property){
       return _get(_getId(obj), property); 
    };

    //clears the current context queue for the given object 
    context.clear = function(){
      _clear(_getId(obj)); 
    }

    //pops the next functionin context queue and defers execution for the given object
    context.next = function(){
      var obj_id = _getId(obj);

      //set async to true on object
      _stack[obj_id]["_async"] = true;

      return _next(obj, true);
    };

    //decrements the running functions count
    //triggers after callback when running function count is zero
    context.done = function(){
      var result = arguments[0];
      return _done(obj, result); 
    };

    return context;
  };
  
  _sugarless.get = function(){
     var obj_id = _getId(this);
     var property = arguments[0];

     return _get(obj_id, property); 
  };

  _sugarless.set = function(){
    var obj_id = _getId(this);
    var property = arguments[0];
    var value = arguments[1];

   _set(obj_id, property, value); 
  };

  //invokes a function available in the object's prototype chain
  _sugarless.invoke = function(){
    var passed_args = Array.prototype.slice.call(arguments);
    //if an array is passed
    if(passed_args.length === 1 && typeof passed_args[0] !== "string"){
      passed_args = passed_args[0]; 
    }

    //extract the method 
    var method = this[passed_args.shift()];  
    
    return method.apply(this, passed_args); 
  };

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      // Export module
      module.exports = _sugarless;
    }
    exports["Sugarless"] = _sugarless;
  }
  else {
    root["Sugarless"] = _sugarless;
  }
  
}(this || window));
