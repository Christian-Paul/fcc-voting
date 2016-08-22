$('.init-new-option').click(function() {
	$('.init-new-option').toggle(400, function() {
		$('.new-option-form').toggle(400);
	});
});

$('.cancel-new').click(function() {
	$('.new-option-form').toggle(400, function() {
		$('.init-new-option').toggle(400);
	});
});

function updateChart(data) {

	var newVotes = [];

	for(var i = 0; i < data.length; i++) {
	    newVotes.push(data[i].votes);
	}

	myDoughnutChart.data.datasets[0].data = newVotes;
	myDoughnutChart.update();
};

var voteForm = $('#vote-form');

voteForm.submit(function(event) {
	event.preventDefault();

	var action = voteForm.attr('action');
	var formData = voteForm.serialize();

	$.ajax({
		type: 'POST',
		url: action,
		data: formData
	}).done(function(response) {
		// tell user the result of their submission
		alert(response.message);

		// if vote was added, update chart
		if(response.result === 'success') {
			updateChart(response.pollResults);
		}

	}).fail(function(response) {
		console.log('Something went wrong');
	});

});