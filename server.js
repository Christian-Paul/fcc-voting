const express = require('express');
const bodyParser = require('body-parser');
const app = express();
var mongoose = require('mongoose');


mongoose.connect('mongodb://chris:password@ds161245.mlab.com:61245/fcc-voting');


app.listen(3000, function(req, res) {
	console.log('listening on 3000');
})

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});