var port = 8080;
var express = require('express');
var app = express();

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
  res.sendfile('pages/index.html');
});

app.get('/current_state', function(req,res){

});

app.post('/input_commands', function(req,res){
  console.log(req); 
});

app.post('/register_character', function(req,res){
  
})
