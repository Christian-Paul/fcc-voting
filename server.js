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
	var optionsArr = formData.options.split('\r\n').map(function(item) {
		return {
			option: item,
			votes: 0
		}
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
});

app.get('/polls/:tagId', function(req, res) {
	var pollData = {id: req.params.tagId};
	res.render('poll.ejs', {poll: pollData});
});