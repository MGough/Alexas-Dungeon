var port = process.env.PORT || 80
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser')

app.use(express.static('public'));
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
        [1,0,0,1,0,0,0,0,0,1],
        [1,0,0,1,0,0,0,0,0,1],
        [1,0,0,1,0,0,1,0,0,1],
        [1,0,0,1,0,0,1,0,0,1],
        [1,0,0,0,0,0,1,0,0,1],
        [1,0,0,0,0,0,1,0,0,1],
        [1,0,0,1,0,0,1,0,0,1],
        [1,0,0,1,0,0,0,0,0,1],
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
  startingLocations : [{x:1,y:1}],
  startingDamage : 9001,
  width: map.map[0].length,
  height: map.map.length,
}

console.log("Game Data: ", gameData);

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
  var character = map.entities.characters[sessionId];
  if(action == 'move') character = moveCharacter(sessionId,direction);
  if(action == 'attack') character = makeAttack(sessionId,direction);
  if(character != undefined){
    res.send(character); 
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

app.listen(port || 8880,function(){
  console.log("Listening on port: " + port);
});

function moveCharacter(sessionId, direction){
  var direction_vector = {x:0,y:0};
  var character = map.entities.characters[sessionId];
  console.log("Moved Character: ");
  console.log(character);
  character.lastAction = 'move';
  var next_x = character.location.x;
  var next_y = character.location.y;
  if(direction == 'up') direction_vector = {x:0, y:-1};
  if(direction == 'down') direction_vector = {x:0, y:1};
  if(direction == 'left') direction_vector = {x:-1,y:0};
  if(direction == 'right') direction_vector = {x:1,y:0};
  console.log("Direction vector" + direction_vector.x + "," + direction_vector.y);
  if(!(direction_vector.x == 0 && direction_vector.y == 0)){
    console.log(character);
    var char_x = character.location.x;
    var char_y = character.location.y;
    next_x = char_x + direction_vector.x;
    next_y = char_y + direction_vector.y;
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
    if(map.map[next_y][next_x] == 1){
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
    if(map.map[next_y][next_x] == 1){
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

    for(var i = deadMonsterIds.length - 1; i >= 0; i--){
      map.entities.monsters.splice(deadMonsterIds[i], 1); 
    }
    pusher.trigger('DungeonMaster', 'Game',{'message':JSON.stringify(map)});
    return character;
  } 
}

function addCharacter(sessionId){
  map.entities.characters[sessionId] = {};
  map.entities.characters[sessionId].health = gameData.startingHealth;
  map.entities.characters[sessionId].location = gameData.startingLocations[0];
  map.entities.characters[sessionId].damage = gameData.startingDamage;
  pusher.trigger('DungeonMaster', 'Game',{'message':JSON.stringify(map)});
  console.log("Just before added character");
  console.log(map.entities.characters[sessionId]);
  return map.entities.characters[sessionId];
}

function moveMonsters(){
  console.log("MONSTERS ON THE MOOOOOVE");
  console.log(map.entities.monsters);
  console.log(map.entities.monsters.length);
  for(var i=0; i < map.entities.monsters.length; i++){
    var posibillities = [];
    var currentMonster = map.entities.monsters[i];
    console.log(currentMonster);
    curr_x = currentMonster.location.x;
    curr_y = currentMonster.location.y;
    if(viableSquare({x:(curr_x + 1),y:(curr_y)})) posibillities.push({x:(curr_x + 1),y:(curr_y)});
    if(viableSquare({x:(curr_x - 1),y:(curr_y)})) posibillities.push({x:(curr_x - 1),y:(curr_y)});
    if(viableSquare({x:(curr_x),y:(curr_y + 1)})) posibillities.push({x:(curr_x),y:(curr_y + 1)});
    if(viableSquare({x:(curr_x),y:(curr_y - 1)})) posibillities.push({x:(curr_x),y:(curr_y - 1)});
    for(var j = 0; j < posibillities.length; j++){
      Object.keys(map.entities.characters).forEach(function(key,index){
        if(map.entities.characters[key].location.x == posibillities[j].x && map.entities.characters[key].location.y == posibillities[j].y){
          map.entities.characters[key].health--;
          return;
        }
      });
    }
    console.log("Posibillities");
    console.log(posibillities);
    var rand = getRandomInt(0,posibillities.length + 1);
    if(rand == posibillities.length) return;
    currentMonster.location = posibillities[rand];
    console.log("New Position");
    console.log(posibillities[rand]);
    pusher.trigger('DungeonMaster', 'Game',{'message':JSON.stringify(map)});
  }
}

function viableSquare(coord){
  var inbounds = coord.x > 0 && coord.y > 0 && coord.x < gameData.width && coord.y < gameData.height;
  var notWall = map.map[coord.y][coord.x] == 0;
  var noMonster = true;
  for(var i = 0; i < map.entities.monsters.length;i++){
    console.log(map.entities.monsters);
    if(map.entities.monsters[i].location.x == coord.x && map.entities.monsters[i].location.y == coord.y ) noMonster = false;
  }
  console.log("in bounds: " + inbounds);
  console.log("notWall: " + notWall);
  console.log("noMonster: " + noMonster);
  return inbounds && notWall && noMonster;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
setInterval(function(){
 moveMonsters();
 console.log("Moving Monsters");
}, 8000);
