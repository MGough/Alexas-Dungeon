var port = 8080;
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.json());
var Pusher = require('pusher');

console.log("Pusher " + Pusher);

var pusher = Pusher({
  appId: '264680',
  key: '433c548f734c4cf70a7b',
  secret: '***REMOVED***',
  cluster: 'eu',
  encrypted: true 
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
  startingDamage : 9001,
  width: map.map.length,
  height: map.map[0].length
}

console.log("Game Data: ", gameData);

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
  var character = moveCharacter
  if(action == 'move') character = moveCharacter(sessionId,direction);
  if(action == 'attack') character = makeAttack(sessionId,direction)
  if(character != undefined){
    res.send(character); 
  }else{
    res.sendStaus(500);
  }
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

function moveCharacter(sessionId, direction){
  var direction_vector = {x:0,y:0};
  var character = map.entities.characters[sessionId];
  character.lastAction = 'move';
  if(direction == 'up') direction_vector = {x:0, y:-1};
  if(direction == 'down') direction_vector = {x:0, y:1};
  if(direction == 'left') direction_vector = {x:-1,y:0};
  if(direction == 'right') direction_vector = {x:1,y:0};
  if(direction_vector.x != 0 && direction_vector.y!=0){
    var char_x = character.location.x;
    var char_y = character.location.y;
    var next_x = char_x + direction_vector.x;
    var next_y = char_y + direction_vector.y;
    if(next_x < 0 || next_x > gameData.width){
      character.status = 'wall';
      console.log("Character " + sessionId + "hit a wall");
      return character;
    }
    if(map.map[next_x][next_y] == 1){
      character.status = 'wall';
      console.log("Character " + sessionId + "hit a wall");
      return character;
    }

    for(var i = 0; i < map.entities.monsters.length;i++){
      if(map.entities.monsters[i].x == next_x && map.entities.monsters[i].y == next.y){
        character.health--;
        character.status = 'enemy';
        console.log("Character " + sessionId + "hit an enemy");
        return character; 
      }
    }
    
  }
  character.location.x = next_x;
  character.location.y = next_y;
  character.status = 'success';
  return character; 
}

function makeAttack(sessionId, direction){
  var direction_vector = {x:0,y:0};
  var character = map.entities.characters[sessionId];
  character.lastAction = 'attack';
  if(direction == 'up') direction_vector = {x:0, y:-1};
  if(direction == 'down') direction_vector = {x:0, y:1};
  if(direction == 'left') direction_vector = {x:-1,y:0};
  if(direction == 'right') direction_vector = {x:1,y:0};
  if(direction_vector.x != 0 && direction_vector.y!=0){
    var char_x = character.location.x;
    var char_y = character.location.y;
    var next_x = char_x + direction_vector.x;
    var next_y = char_y + direction_vector.y;
    if(map.map[next_x][next_y] == 1){
      character.status = wall;
      return charater;
    }
    var deadMonsterIds = [];
    for(var i=0;i<map.entities.monsters.length;i++){
      var monster_x = map.entities.monsters[i].location.x;
      var monster_y = map.entities.monsters[i].location.y;
      if(next_x == monster_x && next_y == monster_y){
        maps.entities.monsters[i].health--;
        if(maps.entities.monsters[i].health < 1) deadMonsterIds.push(i);
      }
    }
    var offset=0;
    for(var i = 0; i < deadMonsterIds.length; i++){
      map.entities.monsters.splice(i-offset++, 1); 
    }
    character.status = 'success';
    return character;
  } 
}

function addCharacter(sessionId){
  map.entities.players[sessionId] = {};
  map.entities.players[sessionId].health = gameData.startingHealth;
  map.entities.players[sessionId].location = gameData.startingLocations.pop();
  map.entities.players[sessionId].damage = gameData.startingDamage;
  //pusher.trigger('DungeonMaster', 'Game',map);
  return map.entities.players[sessionId];
}
