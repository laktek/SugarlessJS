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
  }

  var _getId = function(obj){
    //check whether the object is available in the objects 
    var obj_id = indexOf(obj, _objects);

    if(obj_id >= 0){
      return obj_id;
    }
    else {
      //push it to the objects array and return the id
      _objects[_objects.length] = obj;
      _stack[_stack.length] = {'functions': [], 'error_handler': null, 'async': false};

      return _objects.length - 1 //return the object id
    }
  }

  var _removeObject = function(id){
    //remove object and it's values from the stack 
    _objects.splice(id, 1);
    _stack.splice(id, 1);
  }

  _next = function(){
    var obj = arguments[0]; 
    var async = arguments[1] || false;

    var obj_id = _getId(obj);
    var stack = _stack[obj_id];
    var current_function_queue = stack['functions'];

    //check the function length to set the next function
    if(typeof current_function_queue[0] === "function"){
      var next_func = current_function_queue.shift();
      var next_args = [];

      var extract_args = function(){
        if(current_function_queue.length && (typeof current_function_queue[0] !== "function")){
          next_args.push(current_function_queue.shift()); 
          extract_args();
        }
      }
      extract_args();

      return function(){
        //turn off the async flag
        if(async){
          stack['async'] = false;
        }

        var passed_args = Array.prototype.slice.call(arguments);
        // modify the argument list with the passed arguments
        for(var i=0; i < passed_args.length; i++){
         next_args[i] = passed_args[i] || next_args[i]; 
        }; 

        //wrap the function call with a try catch block if there's an error handler
        var error_handler = stack['error_handler'];
        if(error_handler){
          try {
            var result = next_func.apply(obj, next_args);
          }
          catch(e) {
            return error_handler.call(obj, e) 
          }
        }
        else {
          var result = next_func.apply(obj, next_args);
        }

        //handle the result if not async
        if(!stack['async']){

          //check if more functions exist in the queue
          if(current_function_queue.length){
            //call in the next function with the result
            return _next(obj)(result);
          }
          else {
            //end the object's lifecycle
            _removeObject(obj_id);

            //return the final result 
            return result;
          }

        }
      }    
    }
    else { 
      throw new Error("no function to run") 
    }
  };

  var _sugarless = function(){
    //set the object
    var obj = arguments[0];
    
    //if the object is undefined exception will be thrown
    if(obj === undefined){
      throw new Error("Should provide an object");
    }

    // optional properties
    var opts = arguments[1] || {};
    var default_obj = opts["defaultObj"] || null;
    var before_func = (typeof opts["before"] === "function") ? opts["before"] : null;
    var after_func = (typeof opts["after"] === "function") ? opts["after"] : null;
    var error_func = (typeof opts["error"] === "function") ? opts["error"] : null;

    //handle null objects  
    //we assume object is null if it's result after type coercion evaluates to null
    //if we can find a default object we set it as the object
    if(obj == null){
      // default value given 
      if(default_obj){
        // check the typeof default value - if function take the return value else given value
        obj = (typeof default_obj === "function") ? default_obj.call(obj) : default_obj;
      }
      else {
        // no default value given, return null for function block
        return function(){ return null; } 
      }
    }
 
    return function(){
      //this is the scope all passed-in functions will be executed

      //assigns the object id
      //if the object is not already in store it will be stored first.
      var obj_id = _getId(obj);
      var stack  = _stack[obj_id];

      //store the error handler
      stack['error_handler'] = error_func;

      var current_function_queue = stack['functions'];

      //checks whether there is already a pending queue
      var is_empty_queue = !(current_function_queue.length || stack['async']);

      //add the before filter
      if(before_func)
        current_function_queue.push(before_func);

      //check if passed argument is an array
      var passed_args = (arguments.length == 1 && (typeof arguments[0] !== "function")) ? arguments[0] : Array.prototype.slice.call(arguments);   
      current_function_queue = current_function_queue.concat(passed_args); 

      //add the after filter
      if(after_func)
        current_function_queue.push(after_func);

      stack['functions'] = current_function_queue;

      //execute the first function (if there's no pending queue)
      if(is_empty_queue)
        return _next(obj)();
    }
  }

  //return the next function in queue for given object
  _sugarless.next = function(){
    var obj = arguments[0]; 
    var obj_id = _getId(obj);

    //set async to true on object
    _stack[obj_id]["async"] = true;

    return _next(obj, true);
  };

  _sugarless.invoke = function(){
    var passed_args = Array.prototype.slice.call(arguments);
    //if an array is passed
    if(passed_args.length === 1 && typeof passed_args[0] !== "string"){
      passed_args = passed_args[0]; 
    }

    //extract the method 
    var method = this[passed_args.shift()];  
    
    return method.apply(this, passed_args); 
  }

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
