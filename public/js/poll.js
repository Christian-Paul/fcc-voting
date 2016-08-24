// handle updating page when a user votes


// update or create chart
function updateChart(options) {
	if( $('#myChart').length ) {
		// if there's already a chart, update it
		var newVotes = [];

		for(var i = 0; i < options.length; i++) {
		    newVotes.push(options[i].votes);
		}

		myDoughnutChart.data.datasets[0].data = newVotes;
		myDoughnutChart.update();
	} else {
		// if there's no chart, create one

		// chart.js needs arrays of values to make the chart with
		// initialize arrays and fill colors array with google charts' first few colors
		var categoryColors = ["#3366CC","#DC3912","#FF9900","#109618","#990099","#3B3EAC","#0099C6","#DD4477","#66AA00","#B82E2E","#316395","#994499","#22AA99","#AAAA11","#6633CC","#E67300","#8B0707","#329262","#5574A6","#3B3EAC"];
		var categoryNames = [];
		var categoryVotes = [];

		// fill name and vote arrays with data from database
		for(var i = 0; i < options.length; i++) {
		    // the current option
		    var option = options[i]

		    categoryNames.push(option.name);
		    categoryVotes.push(option.votes);
		};

		var resultsHolder = $('.poll-results');

	    // append dom elements to hold chart
	    resultsHolder.append('<div class="poll-chart"></div>');
	    var chartHolder = $('.poll-chart');
	    chartHolder.append("<canvas id='myChart' width='400' height='400'></canvas>");
	    var ctx = $('#myChart');

	    // render chart
	    // needs to have a different name, otherwise above code won't work
	    // due to myDoughnutChart being set to undefined
	    var myNewDoughnutChart = new Chart(ctx, {
	        type: 'doughnut',
	        data: {
	            labels: categoryNames,
	            datasets: [{
	                data: categoryVotes,
	                backgroundColor: categoryColors
	            }]
	        }
	    });
	}
};



// update or create results text
function updateText(options) {
	if( $('.text-results').length ) {
		// if there are already text results, replace them with new ones
		var textResults = $('.text-results');
		var newResults = '';

		for(var i = 0; i < options.length; i++) {
			newResults = newResults.concat('<div>' + options[i].name + ': ' + options[i].votes + '</div>');
		}

		textResults.replaceWith('<div class=".text-results">' + newResults + '</div>');
	} else {
		// if there aren't any text results, create them
		var resultsHolder = $('.poll-results');
		var textResults = '';

		for(var i = 0; i < options.length; i++) {
			textResults = textResults.concat('<div>' + options[i].name + ': ' + options[i].votes + '</div>');
		}

    	resultsHolder.append('<div class="text-results">' + textResults + '</div>');
    	// remove no results placeholder
    	$('.no-results-placeholder').remove();
	}
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