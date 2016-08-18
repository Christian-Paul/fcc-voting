var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');
var mongoose = require('mongoose');

require('express-helpers')(app);

app.set('view engine', 'ejs');

app.use('/public', express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://chris:password@ds161245.mlab.com:61245/fcc-voting');

var pollSchema = new mongoose.Schema({
	title: String,
	author: String,
	options: Array
});

var Poll = mongoose.model('Poll', pollSchema)

app.listen(3000, function(req, res) {
	console.log('listening on 3000');
})

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
	Poll.find({}, 'title', function(err, results) {
		if(err) {
			console.log(err);
		} else {
			res.render('index.ejs', {polls: results});
		}
	})
});

app.get('/newpoll', function(req, res) {
	res.sendFile(__dirname + '/newpoll.html');
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
				name: item,
				votes: 0
			});
		});

		var author = formData.author || 'Anonymous';

		var newPoll = new Poll({
			title: formData.title,
			author: author,
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
			res.render('poll.ejs', {poll: result});
		}
	})
});

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