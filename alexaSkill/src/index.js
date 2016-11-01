"use strict";

var gameEnvUrl = "http://52.54.248.154";

var GAME_STATES = {
    GAME: "_GAMEMODE", // Asking trivia questions.
    START: "_STARTMODE", // Entry point, start the game.
    HELP: "_HELPMODE", // The user is asking for help.
    END: "_ENDGAME"
};

/**
 * When editing your questions pay attention to your punctuation. Make sure you use question marks or periods.
 * Make sure the first answer is the correct one. Set at least ANSWER_COUNT answers, any extras will be shuffled in.
 */
var languageString = {
    "en-GB": {
        "translation": {
            "GAME_NAME" : "Alexa's Dungeon", // Be sure to change this for your skill.
            "HELP_MESSAGE": "Say some things, some stuff happens.",
            "REPEAT_QUESTION_MESSAGE": "To repeat the last update, say, repeat. ",
            "ASK_MESSAGE_START": "Would you like to start playing?",
            "HELP_REPROMPT": "To give an answer to a question, respond with the action you wish to take. ",
            "CANCEL_MESSAGE": "Ok, let\'s play again soon.",
            "NO_MESSAGE": "Ok, we\'ll play another time. Goodbye!",
            "GAME_UNHANDLED": "Try making a move.",
            "HELP_UNHANDLED": "Say yes to continue, or no to end the game.",
            "START_UNHANDLED": "Say start to start a new game.",
            "NEW_GAME_MESSAGE": "Welcome to %s. ",
            "WELCOME_MESSAGE": "You begin in a dark, damp room full of unwashed trolls. Also known as, Brumhack. Make your move.",
            "MADE_A_MOVE": "You made a move",
            "WALKED_WALL": ["You walked into a wall.", "You walked into a wall, you should really get some sleep", "You walked into a wall, have you been drinking?", "You hit your head on a wall, I thought you were smart", "In your attempt to become one with the wall, you hit your head.", "You walked into a wall, you really do have the intelligence of a brick"],
            "WALKED_ENEMY": "You walked into an enemy, that hurt",
            "ATTACKED_WALL": ["You attacked an inanimate object", "You attacked the wall, what did the wall ever do to you?", "You attacked the wall, is that your feeble attempt to leave a mark on the world?"],
            "ATTACKED_ENEMY": ["You attacked the enemy dealing great damage", "You smite your foe!"],
            "MOVED_DIRECTION": "You moved %s",
            "ATTACKED_DIRECTION": ["You bravely attacked the air %s", "You swung at the air, it didn't flinch"]
        }
    }
};

var request = require('request');
var syncRequest = require('sync-request');
var Alexa = require("alexa-sdk");
var APP_ID = '***REMOVED***';  // TODO replace with your app ID (OPTIONAL).


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, triviaStateHandlers, helpStateHandlers, endGameStateHandlers);
    alexa.execute();
};

var newSessionHandlers = {
    "LaunchRequest": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", true);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", true);
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser", true);
    },
    "Unhandled": function () {
        var speechOutput = this.t("START_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    }
};

var endGameStateHandlers = Alexa.CreateStateHandler(GAME_STATES.END, {
    "EndGame": function () {
        this.handler.state = GAME_STATES.END;
        this.emit(":tell", "You died, what a surprise.");
    }
});

var startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    "StartGame": function (newGame) {
        var speechOutput = newGame ? this.t("NEW_GAME_MESSAGE", this.t("GAME_NAME")) + this.t("WELCOME_MESSAGE") : "";
        var sessionID = this.event.session.sessionId;

        var res = syncRequest('POST',  gameEnvUrl + '/register_character', {
            json: { sessionId: sessionID }
        });

        if (res.statusCode == 200) {
            var body = JSON.parse(res.body.toString());
            console.log(body);
        }

        Object.assign(this.attributes, {
            "speechOutput": speechOutput,
           "repromptText": speechOutput 
        });

        // Set the current state to trivia mode. The skill will now use handlers defined in triviaStateHandlers
        this.handler.state = GAME_STATES.GAME;
        this.emit(":askWithCard", speechOutput, speechOutput, this.t("GAME_NAME"), speechOutput);
    },
    "Unhandled": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", false);
    }
});

var triviaStateHandlers = Alexa.CreateStateHandler(GAME_STATES.GAME, {
    "AnswerIntent": function () {
        handleUserMove.call(this);
    },
    "AttackIntent": function () {
        handleUserAttack.call(this)
    },
    "DontKnowIntent": function () {
        // perhaps skip
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", false);
    },
    "AMAZON.RepeatIntent": function () {
        this.emit(":ask", this.attributes["speechOutput"], this.attributes["repromptText"]);
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser", false);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "Unhandled": function () {
        var speechOutput = "Please try again";
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in game state: " + this.event.request.reason);
    }
});

var helpStateHandlers = Alexa.CreateStateHandler(GAME_STATES.HELP, {
    "helpTheUser": function (newGame) {
        var askMessage = newGame ? this.t("ASK_MESSAGE_START") : this.t("REPEAT_QUESTION_MESSAGE") + this.t("STOP_MESSAGE");
        var speechOutput = this.t("HELP_MESSAGE") + askMessage;
        var repromptText = this.t("HELP_REPROMPT") + askMessage;
        this.emit(":ask", speechOutput, repromptText);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", false);
    },
    "AMAZON.RepeatIntent": function () {
        var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.HelpIntent": function() {
        var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.YesIntent": function() {
        if (this.attributes["speechOutput"] && this.attributes["repromptText"]) {
            this.handler.state = GAME_STATES.GAME;
            this.emitWithState("AMAZON.RepeatIntent");
        } else {
            this.handler.state = GAME_STATES.START;
            this.emitWithState("StartGame", false);
        }
    },
    "AMAZON.NoIntent": function() {
        var speechOutput = this.t("NO_MESSAGE");
        this.emit(":tell", speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.handler.state = GAME_STATES.GAME;
        this.emitWithState("AMAZON.RepeatIntent");
    },
    "Unhandled": function () {
        var speechOutput = this.t("HELP_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in help state: " + this.event.request.reason);
    }
});

function handleUserMove() {
    var sessionID = this.event.session.sessionId;
    var answerSlotValid = isAnswerSlotValid(this.event.request.intent);
    if(answerSlotValid) {
        var userDirection = this.event.request.intent.slots.Answer.value;
        console.log("User said move " + userDirection);
        var res = syncRequest('POST',  gameEnvUrl + '/input_commands', {
            json: { sessionId: sessionID, action: 'move', direction: userDirection }
        });

        if (res.statusCode == 200) {
            var body = JSON.parse(res.body.toString());
            console.log(body);
            if (body.health < 1) {
                console.log("Player dead");
                this.handler.state = GAME_STATES.END;
                this.emitWithState("EndGame", false);
            } else if(body.status == "wall") {
                var statements = this.t("WALKED_WALL");
                var random =  Math.floor(Math.random() * (statements.length)) + 0;
                this.emit(":askWithCard", statements[random]);
            } else if (body.status == "enemy") {
                this.emit(":askWithCard", this.t("WALKED_ENEMY"));
            } else {
                this.emit(":askWithCard", this.t("MOVED_DIRECTION", userDirection));
            }
        }
        
    } else {
        this.emit(":askWithCard", "Please try again"); 
    }   
}

function handleUserAttack() {
    var sessionID = this.event.session.sessionId;
    var answerSlotValid = isAnswerSlotValid(this.event.request.intent);

    if(answerSlotValid) {
        var userDirection = this.event.request.intent.slots.Answer.value;
        
        console.log("User said attack " + userDirection);
        var res = syncRequest('POST',  gameEnvUrl + '/input_commands', {
            json: { sessionId: sessionID, action: 'attack', direction: userDirection }
        });

        if (res.statusCode == 200) {
            var body = JSON.parse(res.body.toString());
            console.log(body);
            if (body.health < 1) {
                console.log("Player dead");
                this.handler.state = GAME_STATES.END;
                this.emitWithState("EndGame", false);
            } else if(body.status == "wall") {
                var random = Math.floor(Math.random() * (2 - 0 + 1)) + 0;
                this.emit(":askWithCard", this.t("ATTACKED_WALL")[random]);
            } else if (body.status == "enemy") {
                var random = Math.floor(Math.random() * (1 - 0 + 1)) + 0;
                this.emit(":askWithCard", this.t("ATTACKED_ENEMY")[random]);
            } else {
                var random = Math.floor(Math.random() * (1 - 0 + 1)) + 0;
                this.emit(":askWithCard", this.t("ATTACKED_DIRECTION", userDirection)[random]);
            }
        }
    } else {
        this.emit(":askWithCard", "Please try again"); 
    }   
}


function isAnswerSlotValid(intent) {
    var answerSlotFilled = intent && intent.slots && intent.slots.Answer && intent.slots.Answer.value;
    return answerSlotFilled
}