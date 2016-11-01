# Alexas-Dungeon
A dungeon crawler controlled entirely by Amazon Alexa, built in 24 hours at Brumhack 5.0. It's certainly not perfect, but the basic mechanics are there. It does sometimes say `undefined` if you leave it alone for too long, which is definitely a feature.

#Setting up
In order to run this you'll need and AWS Lambda and an Alexa skill set up using the contents of the `alexaSkill` directory.

You'll also want to deploy the contents of the server folder somewhere. They're set up to work with Heroku, so should run build and run there without issue.

Make sure you create a Pusher.com account and put the correct details into the `server/server.js` file. Once all that's done you should be good to go.

#Playing the game
Make sure Dungeon Master is present in your alexa skills.
Say `Start dungeon master`.

You can now say `move {direction}` or `attack {direction}`, there are four possible directions: up, down, left right. Enjoy!
