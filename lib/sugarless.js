var Sugarless = (function(){

  var _adhoc_value_for = {};
  var _next_function_for = {};

  var _sugarless = function(){
    var obj = arguments[0];
    var opts = arguments[1] || {};
    var default_obj = opts["default"];
    var before_func = (typeof opts["before"] === "function") ? opts["before"] : null;
    var after_func = (typeof opts["after"] === "function") ? opts["after"] : null;

    //if the object is undefined exception will be thrown
    if(typeof obj == "undefined"){
      throw new Error("Should provide an object");
    }

    //handle null objects  
    //we assume object is null if it's result after type coercion evaluates to null
    //if we can find a default object we set it as the object
    if(obj == null && typeof default_obj !== "undefined"){
      // default value given 
      // check the typeof default value - if function take the return value else given value
      if(typeof default_obj === "function"){
        obj = default_obj(); 
      }
      else {
        obj = default_obj; 
      }
    }

    //check for the final value of object
    //if it's still null return a function that will return null
    if(obj == null){
      return function(){ return null; } 
    }
 
    return function(){
      //this is the scope all passed-in functions will be executed
      
      //traverse through arguments list collecting functions and their parameters
      var functions = [];
      var parameters = [];
      var current_arg;
      var current_params = null;

      while(arguments.length > 0){
        current_arg = Array.prototype.shift.call(arguments);

        if(typeof current_arg === "function"){
          //push existing current params to parameters
          if(current_params != null){
            parameters.push(current_params);

            //push empty parameters for after callback
           if(after_func != null){
              parameters.push([]); 
            }
          }

          //push the before callback if defined
          if(before_func != null){
            functions.push(before_func); 
            parameters.push([]); 
          }

          //push the current function into functions
          functions.push(current_arg); 

          //push the after callback if defined
          if(after_func != null){
            functions.push(after_func); 
          }

          //start collecting a new current params list
          current_params = [];
        }
        else {
          current_params.push(current_arg);
        }
      }

      //pass in last set of current params
      if(current_params != null){
        parameters.push(current_params);
        current_params = [];
      }

      //set the next function to be executed
      _next_function_for[obj] = function(){
        console.log(functions);
        //check the function length to set the next function
        if(functions.length > 0){
          var next_func = functions.shift();
          var next_params = parameters.shift(); 

          return function(){
            var modified_params = arguments.length===0 ? next_params : Array.prototype.slice.call(arguments).concat(next_params); 
            var adhoc_result = next_func.apply(obj, modified_params);

            //assign the adhoc result if it's not undefined
            if(typeof adhoc_result !== "undefined"){
              _adhoc_value_for[obj] = adhoc_result;

              //call in the next function synchrnously (if exists)
              if(functions.length > 0){
                return _next_function_for[obj]()();
              }
              else {
                //return the final result 
                return adhoc_result;
              }
            }
          }
        }    
        else { 
          // no more functions to run
          return function(){
            throw new Error("no function to run") 
          }
        }
      }

      //execute the first function
      return _next_function_for[obj]()();
    }
  }

  //return the adhoc value for given object
  _sugarless.adhoc = function(){
    var obj = arguments[0]; 
    return _adhoc_value_for[obj]
  };

  //return teh next function in queue for given object
  _sugarless.next = function(){
    var obj = arguments[0]; 
    _next_function_for[obj]();
  };

  return _sugarless;
}());
