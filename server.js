var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config.js');
var Twitter = require('node-twitter-api');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
require('express-helpers')(app);

app.set('view engine', 'ejs');

var sessionOptions = {
	secret: 'rgdhdgaweklgfwerlg',
	saveUninitialized: true,
	resave: false,
	store: new FileStore(),
	name: 'my.connect.sid'
}


app.use(session(sessionOptions));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));

var twitter = new Twitter({
	consumerKey: config.consumerKey,
	consumerSecret: config.consumerSecret,
	callback: config.callbackUrl
});


mongoose.connect('mongodb://' + config.mongooseUsername + ':' + config.mongoosePassword + '@ds161245.mlab.com:61245/fcc-voting');

var pollSchema = new mongoose.Schema({
	title: String,
	author: {
		name: String,
		twitterId: Number
	},
	options: [{ name: String, votes: { type: Number, default: 0 } }]
});

var Poll = mongoose.model('Poll', pollSchema)

app.listen(3000, function(req, res) {
	console.log('listening on 3000');
})

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

app.get('/newpoll', function(req, res) {
	res.render('newpoll.ejs', {userInfo: req.session.userInfo});
});

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

	var userChoice = req.body['user-choice'];
	var locationString = 'options.' + userChoice + '.votes';

	var updateObj = {};
	updateObj[locationString] = 1;


	Poll.findOneAndUpdate( {'_id': req.params.tagId}, { $inc: updateObj }, function(err, doc) {
		if(err) {
			console.log(err);
		} else {
			res.redirect('/polls/' + req.params.tagId);
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