var port = 8080;
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser')
app.use(bodyParser.json());
var Pusher = require('pusher');

console.log("Pusher " + Pusher);

var pusher = new Pusher({
  appId: '264680',
  key: '433c548f734c4cf70a7b',
  secret: '***REMOVED***',
  cluster: 'eu',
  encrypted: true,
});

console.log( "pusher " + pusher);

var map = {
  map: [[1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
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
    characters: {}
  }
};

var gameData = {
  startingHealth : 4,
  startingLocations : [{x:4,y:4}],
  startingDamage : 9001,
  width: map.map.length,
  height: map.map[0].length
}

console.log("Game Data: ", gameData);

app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/pages/index.html'));
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
  var character;
  if(action == 'move') character = moveCharacter(sessionId,direction);
  if(action == 'attack') character = makeAttack(sessionId,direction)
  if(character != undefined){
    res.send(character); 
  }else{
    res.sendStatus(500);
  }
});

app.post('/register_character', function(req,res){
  console.log("Registering Character");
  console.log(req.body);
  var character = {}
  if(req.body.sessionId != undefined){
    character = addCharacter(req.body.sessionId);
    console.log("Initial Character: ");
    console.log(character);
  }
  res.send(character);  
})
app.listen(80,function(){
  console.log("Listening on port: 80");
});

function moveCharacter(sessionId, direction){
  var direction_vector = {x:0,y:0};
  var character = map.entities.characters[sessionId];
  console.log("Moved Character: ");
  console.log(character);
  character.lastAction = 'move';
  if(direction == 'up') direction_vector = {x:0, y:-1};
  if(direction == 'down') direction_vector = {x:0, y:1};
  if(direction == 'left') direction_vector = {x:-1,y:0};
  if(direction == 'right') direction_vector = {x:1,y:0};
  console.log("Direction vector" + direction_vector.x + "," + direction_vector.y);
  if(!(direction_vector.x == 0 && direction_vector.y == 0)){
    console.log(character);
    var char_x = character.location.x;
    var char_y = character.location.y;
    var next_x = char_x + direction_vector.x;
    var next_y = char_y + direction_vector.y;
    console.log("New x: " + next_x + "New y: " + next_y);
    if(next_x < 0 || next_x > gameData.width){
      character.status = 'wall';
      console.log("Character " + sessionId + "hit a wall");
      return character;
    }
    if(next_y < 0 || next_y > gameData.height){
      character.status = 'wall';
      console.log("Character " + sessionId + "hit a wall");
      return character;
    }
    if(map.map[next_x][next_y] == 1){
      character.status = 'wall';
      console.log("Character " + sessionId + "hit a wall");
      return character;
    }

    console.log("MONSTERS");
    for(var i = 0; i < map.entities.monsters.length;i++){
      console.log(map.entities.monsters[i]);
      if(map.entities.monsters[i].location.x == next_x && map.entities.monsters[i].location.y == next_y){
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
  pusher.trigger('DungeonMaster', 'Game',{'message':JSON.stringify(map)});
  return character; 
}

function makeAttack(sessionId, direction){
  var direction_vector = {x:0,y:0};
  var character = map.entities.characters[sessionId];
  character.lastAction = 'attack';
  console.log("Attack Character");
  console.log(character);
  if(direction == 'up') direction_vector = {x:0, y:-1};
  if(direction == 'down') direction_vector = {x:0, y:1};
  if(direction == 'left') direction_vector = {x:-1,y:0};
  if(direction == 'right') direction_vector = {x:1,y:0};
  if(!(direction_vector.x == 0 && direction_vector.y==0)){
    var char_x = character.location.x;
    var char_y = character.location.y;
    var next_x = char_x + direction_vector.x;
    var next_y = char_y + direction_vector.y;
    if(map.map[next_x][next_y] == 1){
      character.status = 'wall';
      return character;
    }
    character.status = 'success';
    var deadMonsterIds = [];
    for(var i=0;i<map.entities.monsters.length;i++){
      var monster_x = map.entities.monsters[i].location.x;
      var monster_y = map.entities.monsters[i].location.y;
      if(next_x == monster_x && next_y == monster_y){
        map.entities.monsters[i].health--;
        character.status = 'enemy';
        if(map.entities.monsters[i].health < 1) deadMonsterIds.push(i);
      }
    }
    var offset=0;
    for(var i = 0; i < deadMonsterIds.length; i++){
      map.entities.monsters.splice(i-offset++, 1); 
    }
    pusher.trigger('DungeonMaster', 'Game',{'message':JSON.stringify(map)});
    return character;
  } 
}

function addCharacter(sessionId){
  map.entities.characters[sessionId] = {};
  map.entities.characters[sessionId].health = gameData.startingHealth;
  map.entities.characters[sessionId].location = gameData.startingLocations.pop();
  map.entities.characters[sessionId].damage = gameData.startingDamage;
  pusher.trigger('DungeonMaster', 'Game',{'message':JSON.stringify(map)});
  console.log("Just before added character");
  console.log(map.entities.characters[sessionId]);
  return map.entities.characters[sessionId];
}