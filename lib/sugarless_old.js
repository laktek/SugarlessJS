var sugarless = (function(){
  var _sugarless = function(){
    var _obj = arguments[0];
    var _opts = arguments[1] || {};
    var _default_obj = _opts["default"];
    var _before_func = (typeof _opts["before"] === "function") ? _opts["before"] : null;
    var _after_func = (typeof _opts["after"] === "function") ? _opts["after"] : null;
    
    //if the object is undefined exception will be thrown
    if(typeof _obj == "undefined"){
      throw new Error("Should provide an object");
    }

    //handle null objects  
    //we assume object is null if it's result after type coercion evaluates to null
    //if we can find a default object we set it as the object
    if(_obj == null && typeof _default_obj !== "undefined"){
      // default value given 
      // check the typeof default value - if function take the return value else given value
      if(typeof _default_obj === "function"){
        _obj = _default_obj(); 
      }
      else {
        _obj = _default_obj; 
      }
    }

    //check for the final value of object
    //if it's still null return a function that will return null
    if(_obj == null){
      return function(){ return null; } 
    }
    
    //proceeding to handle normal objects
    return function(){
      //this is the scope all passed-in functions will be executed
      var _previous_adhoc_value = _sugarless.adhoc; //store the previous scope's adhoc value
      _sugarless.adhoc = null;
      
      //traverse through arguments list collecting functions and their parameters
      var _functions = [];
      var _parameters = [];
      var _current_arg;
      var _current_params = null;

      while(arguments.length > 0){
        _current_arg = Array.prototype.shift.call(arguments);

        if(typeof _current_arg === "function"){
          //push existing current params to parameters
          if(_current_params != null){
            _parameters.push(_current_params);

            //push empty parameters for after callback
            if(_after_func != null){
              _parameters.push([]); 
            }
          }

          //push the before callback if defined
          if(_before_func != null){
            _functions.push(_before_func); 
            _parameters.push([]); 
          }

          //push the current function into functions
          _functions.push(_current_arg); 

          //push the after callback if defined
          if(_after_func != null){
            _functions.push(_after_func); 
          }

          //start collecting a new current params list
          _current_params = [];
        }
        else {
          _current_params.push(_current_arg);
        }
      }

      //pass in last set of current params
      if(_current_params != null){
        _parameters.push(_current_params);
        _current_params = [];
      }

      //raise an exception if there are no defined functions
      if(typeof _functions[0] !== "function"){
        throw new Error("should at least provide one function") 
      }

      var _current_func;
      var _params_for_current_func;
      while(_functions.length > 0){
        _current_func = _functions.shift();
        _params_for_current_func = _parameters.shift();
        
        //redefine defer to the context
        _sugarless.defer = function(){
          //shift the parameters
          var _deferred_function = _functions.shift();
          var _deferred_function_params = _parameters.shift();

          //return the next function to be executed 
          return function(){ 
            var modified_arguments = arguments.length===0? _deferred_function_params : Array.prototype.slice.call(arguments).concat(_deferred_function_params);
            return _deferred_function.apply(_obj, modified_arguments); 
          }
        };

        //execute the current function and store the result in adhoc
        var adhoc_result = _current_func.apply(_obj, _params_for_current_func);
        //assign the adhoc result if it's not null or undefined
        if(typeof adhoc_result !== "undefined" && adhoc_result != null){
          _sugarless.adhoc = adhoc_result
        }
      }

      //return the last ad-hoc result as the final result
      var result = _sugarless.adhoc;
      _sugarless.adhoc = _previous_adhoc_value; //reset to previous adhoc value
      return result;
    };
  };

  //export variables
  _sugarless["adhoc"] = null;
  _sugarless["defer"] = function(){};

  return _sugarless
}());
