// handle adding new options and updating page


// update chart
function updateChart(options) {
	var newVotes = [];

	for(var i = 0; i < options.length; i++) {
	    newVotes.push(options[i].votes);
	}

	myDoughnutChart.data.datasets[0].data = newVotes;
	myDoughnutChart.update();
};

// update text
function updateText(options) {
	var textResults = $('.text-results');
	var newResults = '';

	for(var i = 0; i < options.length; i++) {
		newResults = newResults.concat('<div>' + options[i].name + ': ' + options[i].votes + '</div>');
	}

	textResults.replaceWith(
		'<div class=".text-results">' + newResults + '</div>'
		);
};


// when user clicks 'add your own option...' the new option interface appears
$('.init-new-option').click(function() {
	$('.init-new-option').toggle(400, function() {
		$('.new-option-form').toggle(400);
	});
});


// when user clicks cancel, the new option interface is hidden
$('.cancel-new').click(function() {
	$('.new-option-form').toggle(400, function() {
		$('.init-new-option').toggle(400);
	});
});

// handle user votes
var voteForm = $('#vote-form');
voteForm.submit(function(event) {
	// prevent the html form from reloading the page
	event.preventDefault();

	// action is the backend destination we need to send the request to
	// it contains the poll id and the route
	var action = voteForm.attr('action');
	// encode form results as strings
	var formData = voteForm.serialize();


	$.ajax({
		type: 'POST',
		url: action,
		data: formData
	}).done(function(response) {
		// tell user the result of their submission
		alert(response.message);

		// if vote was added, update chart and text results
		if(response.result === 'success') {
			updateChart(response.pollResults);
			updateText(response.pollResults);
		}

	}).fail(function(response) {
		console.log('Something went wrong');
	});

});