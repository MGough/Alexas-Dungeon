var port = 8080;
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.json());
var Pusher = require('pusher');

console.log("Pusher " + Pusher);

var pusher = Pusher({
  appId:'264680',
  key:'433c548f734c4cf70a7b',
  secret:'***REMOVED***',
  cluster:'eu',
  encrypted:true
});

console.log( "pusher " + pusher);

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
var testPlayer = {
  health:-1,
  location:{x:5,y:7},
  damage:9001,
  lastAction: 'move',
  status: 'wall'
}

var gameData = {
  startingHealth : 4,
  startingLocations : [{x:1,y:1}],
  startingDamage : 9001
}

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
  res.send(testPlayer);/*
  if(sessionId == undefined|| action == undefined || direction == undefined){
    console.log("value from request is undefined");
    res.sendStatus(400);
  }
  if(moveCharacter(req.body.sessionId,req.body.action,req.body.direction)){
    res.sendStatus(200); 
  }else{
    res.sendStaus(500);
  }*/
});

app.post('/register_character', function(req,res){
  console.log("Registering Character");
  console.log(req.body);
  var character = {}
  if(req.body.sessionId != undefined){
    character =addCharacter(req.body.sessionId);
  }
  res.send(character);  
})
app.listen(80,function(){
  console.log("Listening on port: 80");
});

function moveCharacter(sessionId, action, direction){
  return true;
}

function addCharacter(sessionId){
  map.entities.players['sessionId'] = {};
  map.entities.players.sessionId.health = gameData.startingHealth;
  map.entities.players.sessionId.location = gameData.startingLocations.pop();
  map.entities.players.sessionId.damage = gameData.startingDamage;
  //pusher.trigger('DungeonMaster', 'Game',map);
  return map.entities.players.sessionId;
}
