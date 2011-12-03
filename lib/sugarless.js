var Sugarless = (function(){

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
      _objects.push(obj);
      _stack.push({'functions': [], 'error_handler': null});

      return _objects.length - 1 //return the object id
    }
  }

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

    //assigns the object id
    //if the object is not already in store it will be stored first.
    var obj_id = _getId(obj);

    //store the error handler
    _stack[obj_id]['error_handler'] = error_func;
 
    return function(){
      //this is the scope all passed-in functions will be executed

      var current_function_queue = _stack[obj_id]['functions'];

      //checks whether there is already a pending queue
      var is_pending_queue = current_function_queue.length;
      //var is_pending_queue = _functions[obj_id].length > 0;

      //add the before filter
      if(before_func)
        current_function_queue.push(before_func);

      args = Array.prototype.slice.call(arguments);
      if(args.length == 1 && (typeof args[0] !== "function")){
        //assume the passed argument is an array
        args = args[0].slice(); 
      }
      current_function_queue = current_function_queue.concat(args);

      //add the after filter
      if(after_func)
        current_function_queue.push(after_func);

      //reassign current function queue to original
      _stack[obj_id]['functions'] = current_function_queue;

      //execute the first function (if there's no pending queue)
      if(!is_pending_queue)
        return _sugarless.next(obj)();
    }
  }

  //return the next function in queue for given object
  _sugarless.next = function(){
    var obj = arguments[0]; 
    var obj_id = _getId(obj);
    var current_function_queue = _stack[obj_id]['functions'];

    //check the function length to set the next function
    if(typeof current_function_queue[0] === "function"){
      var next_func = current_function_queue.shift();
      var next_params = [];

      var extract_params = function(){
        if(current_function_queue.length && (typeof current_function_queue[0] !== "function")){
          next_params.push(current_function_queue.shift()); 
          extract_params();
        }
      }
      extract_params();

      return function(){
        var modified_params = arguments.length===0 ? next_params : Array.prototype.slice.call(arguments).concat(next_params); 

        try {
          var result = next_func.apply(obj, modified_params);
        }
        catch(e) {
          //pass exceptions to error handler 
          var error_handler = _stack[obj_id]['error_handler'];
          if(error_handler){
            return error_handler.call(obj, e) 
          }
          else { 
            throw e; 
          }
        }

        //assign the esult if it's not undefined
        if(result !== undefined){

          //call in the next function synchrnously (if exists)
          if(current_function_queue.length){
            return _sugarless.next(obj)(result);
          }
          else {
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

  _sugarless.invoke = function(){
    var passed_args = Array.prototype.slice.call(arguments);
    //slice it again if the first argument is not a string (assume an array is passed)
    if(passed_args.length === 1 && typeof passed_args[0] !== "string"){
      passed_args = passed_args[0].slice(); 
    }

    //extract the method 
    var method = this[passed_args.shift()];  
    
    return method.apply(this, passed_args); 
  }


  return _sugarless;
}());
