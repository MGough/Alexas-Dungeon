var port = 8080;
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.json());

var map = {
  width: 10,
  map: [[1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]],
  entities: {
    monsters: [
      {
        health: 1,
        location: {x:5,y:5}
      },{
        health: 1,
        location: {x:5,y:4}
      }
    ],
    players: {}
  }
};

app.get('/',function(req,res){
  res.sendFile('pages/index.html');
});

app.get('/current_state', function(req,res){

});

app.post('/input_commands', function(req,res){
  console.log("Recieved a request");
  console.log(req.body);
  var sessionId = req.body.sessionId;
  var action = req.body.action;
  var direction = req.body.direction;
  if(sessionId == undefined|| action == undefined || direction == undefined){
    console.log("value from request is undefined");
    res.sendStatus(400);
  }
  moveCharacter(req.body.sessionId,req.body.action,req.body.direction);
  res.sendStatus(200); 
});

app.post('/register_character', function(req,res){
  console.log("Registering Character");
  console.log(req.body);
  res.sendStatus(200);  
})
app.listen(80,function(){
  console.log("Listening on port: 80");
})
 function moveCharacter(){
return true;
}
