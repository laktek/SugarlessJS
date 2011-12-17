// preview and play in JSBin - http://jsbin.com/iyecoy/2/edit#source

//loggging  for JSBin
var log = function(msg){
  if (document.getElementById('log')) {
    document.getElementById('log').innerHTML = document.getElementById('log').innerHTML + "<br/>" + msg;
  }
};

/* helper functions */

//sanitizes html tags
var sanitize = function(){
  var str = arguments[0] || this;
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, "&apos;");
};

//removes all trailing whitespaces
var trim = function(){
  var str = arguments[0] || this;
  var native_method = String.prototype.trim;

  if(native_method){
    return native_method.call(str); 
  }
  else {
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
  }
};

//truncates the string
var truncate = function(){
  var str = arguments[0] || this;
  var length = parseInt(arguments[1]);

  return str.length > length ? str.slice(0,length) + '...' : str;
};

/* Function calls */
var input = "  This is <a href='#'>Test</a> string. Which is <b>longer</b> than 50 characters <br/>   ";
    
Sugarless(input)(
    sanitize            
  , trim                
  , truncate, "", 50   //passes a default string to retain the argument order
  , log
);

