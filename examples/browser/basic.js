// preview and play in JSBin - http://jsbin.com/aviyuf/edit#source 

//loggging  for JSBin
var log = function(msg){
  if (document.getElementById('log')) {
    document.getElementById('log').innerHTML = document.getElementById('log').innerHTML + "<br/>" + msg;
  }
};

/* helper functions */

var getProp = function(property){
  log(property + " - " + this[property]); 
};

var setProp = function(property, value){
  this[property] = value;
}

/* Function calls */

Sugarless({name: "Tom"})(
    getProp, "name"
  , setProp, "name", "Tommy"
  , getProp, "name"
);

Sugarless({name: "Jerry"})(
     getProp, "name"
   , setProp, "age", 10
   , getProp, "age"
);
