var http = require('http');
var url = require('url')
var $_ = require('../../lib/sugarless.js');

var getName = function(){
  var params = url.parse(this.url, true).query;
  var name = params["name"] || "Buddy";
  return { "name": name };
};

var getLocation = function(params){
  var user_ip = this.connection.remoteAddress;
  var callback = $_(this).next(); //extract the next function in queue

  var client = http.createClient(80, "www.geoplugin.net");
  var request = client.request("GET", "/json.gp?ip=" + user_ip, {'host': 'www.geoplugin.net'});
  request.end();

  request.on('response', function (response) {
    response.setEncoding("utf8");
    var response_body = [];

    response.on('data', function (chunk) {
      response_body.push(chunk);
    });

    response.on('end', function () {
      var geoPlugin = function(){ return arguments[0]; }
      var json_output = eval(response_body.join(""));
      params["country"] = json_output["geoplugin_countryName"];

      callback(params);
    });
  });
};

var prepareMessage = function(params){
  var output = ["Hello!"];
  output.push(params["name"]);

  if(params["country"]){
    output.push("from " + params["country"]);
  }

  return output.join(" ");
};

var sendResponse = function(message, res){
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(message);
};

http.createServer(function (req, res) {
  // normal way
  // var params = url.parse(req.url, true).query;
  // var name = params["name"] || "Buddy";
  // var message = "Hello! " + name;
  // 
  // res.writeHead(200, {'Content-Type': 'text/plain'});
  // res.end(message);

  //Sugarless way
  $_(req)(
     getName
   , getLocation
   , prepareMessage
   , sendResponse, "Hello! visitor", res  
  ); 
   
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');

