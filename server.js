var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var Twitter = require('node-twitter-api');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
require('express-helpers')(app);
app.enable('trust proxy');
var port = process.env.PORT || 3000;

// get credentials from config file in dev, or from heroku env in deployment
if(port === 3000) {
	var config = require('./config.js');
} else {
	var config = {
		mongooseUsername: process.env.mongooseUsername,
		mongoosePassword: process.env.mongoosePassword,
		consumerKey: process.env.consumerKey,
		consumerSecret: process.env.consumerSecret,
		callbackUrl: process.env.callbackUrl
	};
}

app.set('view engine', 'ejs');

var sessionOptions = {
	secret: 'rgdhdgaweklgfwerlg',
	saveUninitialized: true,
	resave: false,
	store: new FileStore(),
	name: 'my.connect.sid'
};

// middleware
app.use(session(sessionOptions));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));

var twitter = new Twitter({
	consumerKey: config.consumerKey,
	consumerSecret: config.consumerSecret,
	callback: config.callbackUrl
});



// database initialization
mongoose.connect('mongodb://' + config.mongooseUsername + ':' + config.mongoosePassword + '@ds161245.mlab.com:61245/fcc-voting');

var pollSchema = new mongoose.Schema({
	title: String,
	author: {
		name: String,
		twitterId: Number
	},
	options: [{ name: String, votes: { type: Number, default: 0 } }],
	voters: Array
});

var Poll = mongoose.model('Poll', pollSchema)



// begin app
app.listen(port, function(req, res) {
	console.log('listening on 3000');
})

// index page: list polls currently in database
app.get('/', function(req, res) {
	Poll.find({}, 'title', function(err, results) {
		if(err) {
			console.log(err);
		} else {
			res.render('index.ejs', {polls: results, userInfo: req.session.userInfo});
		}
	})
});

var _requestSecret;

// when a user clicks 'sign in' get a request token from twitter and redirect user to sign in with token
app.get('/request-token', function(req, res) {
	twitter.getRequestToken(function(err, requestToken, requestSecret) {
		if(err) {
			res.status(500).send(err);
		} else {
			_requestSecret = requestSecret;
			res.redirect('https://api.twitter.com/oauth/authenticate?oauth_token=' + requestToken);
		}
	});
});

// when user is sent back from twitter, use results to obtain credentials
app.get('/login/twitter/callback', function(req, res) {
	var requestToken = req.query.oauth_token;
	var verifier = req.query.oauth_verifier;

    twitter.getAccessToken(requestToken, _requestSecret, verifier, function(err, accessToken, accessSecret) {
        if (err)
            res.status(500).send(err);
        else
            twitter.verifyCredentials(accessToken, accessSecret, function(err, user) {
                if (err)
                    res.status(500).send(err);
                else {
                	req.session.userInfo = user;
                	req.session.save(function(err) {
                		if(err) {
                			console.log(err);
                		} else {
                			res.redirect('/');
                		}
                	});
                }
            });
    });
});

// sign out: destroy session and clear cookies
app.get('/sign-out', function(req, res) {
	req.session.destroy(function(err) {
		if(err) {
			console.log(err);
		} else {
			res.clearCookie(sessionOptions.name);
			res.redirect('/');
		}
	})
});

// view poll creation page
app.get('/newpoll', function(req, res) {
	res.render('newpoll.ejs', {userInfo: req.session.userInfo});
});


// create a new poll
app.post('/new-poll', function(req, res) {
	var formData = req.body;
	var optionsArr = [];

	// validates that the request object has a title and options property and they contain content
	if(
		formData.hasOwnProperty('title') && formData.title &&
		formData.hasOwnProperty('options') && formData.options 
		) {

		formData.options.split('\r\n').forEach(function(item) {
			optionsArr.push({
				name: item
			});
		});

		var newPoll = new Poll({
			title: formData.title,
			author: {
				name: req.session.userInfo['screen_name'],
				twitterId: req.session.userInfo.id
			},
			options: optionsArr
		});

		newPoll.save(function(err) {
			if(err) {
				console.log(err);
			}
		});
		res.redirect('/')	
	}
});

// look up a poll by database id
app.get('/polls/:tagId', function(req, res) {
	Poll.findOne( {'_id': req.params.tagId}, function(err, result) {
		if(err) {
			console.log(err);
		} else {
			res.render('poll.ejs', {poll: result, userInfo: req.session.userInfo});
		}
	})
});


// process a vote
app.post('/polls/:tagId/vote', function(req, res) {

	// the number corresponding to the user's vote
	var userChoice = req.body['user-choice'];

	// building a property name to pass to the update field
	// object will look like $inc: { options.2.votes: 1 }
	// to denote the option at index 2 is being incremented by 1
	var locationString = 'options.' + userChoice + '.votes';
	var updateObj = {};
	updateObj[locationString] = 1;


	// find poll and check if the current user has already voted
	Poll.findOne( {'_id': req.params.tagId}, function(err, doc) {
		if(err) {
			console.log(err);
		} else {
			// check to see if voters array contains the user's id or IP already
			// if their id/IP is present, userAlreadyVoted returns true
			if(req.session.hasOwnProperty('userInfo') && req.session.userInfo) {
				var userId = req.session.userInfo.id;
			} else {
				var userId = req.ip;
			}
			var userAlreadyVoted = (doc.voters.indexOf(userId) !== -1);

			if(userAlreadyVoted) {
				res.send({
					result: 'fail',
					message: 'This account or IP address has already voted'
				});
			} else {
				// new set to true so doc object will return updated value
				Poll.findOneAndUpdate( {'_id': req.params.tagId}, { $inc: updateObj, $push: { voters: userId } }, { new: true }, function(err, doc) {
					if(err) {
						console.log(err);
					} else {
						res.send({
							result: 'success',
							message: 'Vote casted for: ' + doc.options[userChoice].name,
							pollResults: doc.options
						});
					}
				});
			}
		}
	});
});


// add a new option to a poll
app.post('/polls/:tagId/add-option', function(req, res) {
	var newOption = {
		votes: 0,
		name: req.body['new-option']
	};


	Poll.findOneAndUpdate( {'_id': req.params.tagId}, { $push: { options: newOption } }, function(err, doc) {
		if(err) {
			console.log(err);
		} else {
			res.redirect('/polls/' + req.params.tagId);
		}
	});
});


// delete a poll
app.get('/polls/:tagId/delete-poll', function(req, res) {
	Poll.findByIdAndRemove(req.params.tagId, function(err, doc) {
		if(err) {
			console.log(err);
		} else {
			res.redirect('/');
		}
	})
});


// view your own polls
app.get('/mypolls', function(req, res) {
	Poll.find( { 'author.twitterId' : req.session.userInfo.id }, function(err, results) {
		res.render('mypolls.ejs', { polls: results, userInfo: req.session.userInfo })
	});
});


// view another user's polls
app.get('/users/:tagId', function(req, res) {
	Poll.find( { 'author.twitterId' : req.params.tagId }, function(err, results) {
		res.render('userpolls.ejs', { polls: results, userInfo: req.session.userInfo })
	});
});