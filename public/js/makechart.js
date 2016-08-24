// poll variable set in script call in poll.ejs. it contains the poll document's data

// chart.js needs arrays of values to make the chart with
// initialize arrays and fill colors array with google charts' first few colors
var categoryColors = ["#3366CC","#DC3912","#FF9900","#109618","#990099","#3B3EAC","#0099C6","#DD4477","#66AA00","#B82E2E","#316395","#994499","#22AA99","#AAAA11","#6633CC","#E67300","#8B0707","#329262","#5574A6","#3B3EAC"];
var categoryNames = [];
var categoryVotes = [];

// will be used to determine if to render chart or placeholder
// is set to true if the iterator finds an option with more than 0 votes
var anyVotes = false;

// fill name and vote arrays with data from database
for(var i = 0; i < poll.options.length; i++) {
    // the current option
    var option = poll.options[i]

    categoryNames.push(option.name);
    categoryVotes.push(option.votes);
    if(option.votes > 0) {
        anyVotes = true;
    }
};

var resultsHolder = $('.poll-results');

// if there are votes, render chart and text results
if(anyVotes) {
    // append dom elements to hold chart
    resultsHolder.append('<div class="poll-chart"></div>');
    var chartHolder = $('.poll-chart');
    chartHolder.append("<canvas id='myChart' width='400' height='400'></canvas>");
    var ctx = $('#myChart');

    // render chart
    var myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryNames,
            datasets: [{
                data: categoryVotes,
                backgroundColor: categoryColors
            }]
        }
    });

    // add text resutls
    var textResults = '';
    categoryNames.forEach(function(name, index) {
        textResults = textResults.concat('<div>' + name + ': ' + categoryVotes[index] + '</div>')
    });
    resultsHolder.append('<div class="text-results">' + textResults + '</div>');
} else {
    // if there were no votes, show placeholder
    resultsHolder.append('<div class="no-results-placeholder">No results yet :C</div>');
}