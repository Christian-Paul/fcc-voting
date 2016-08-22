// poll variable set in script call in poll.ejs. it contains the poll document's data

var categoryColors = ["#3366CC","#DC3912","#FF9900","#109618","#990099","#3B3EAC","#0099C6","#DD4477","#66AA00","#B82E2E","#316395","#994499","#22AA99","#AAAA11","#6633CC","#E67300","#8B0707","#329262","#5574A6","#3B3EAC"];
var categoryNames = [];
var categoryVotes = [];

for(var i = 0; i < poll.options.length; i++) {
    categoryNames.push(poll.options[i].name);
    categoryVotes.push(poll.options[i].votes);
};

var ctx = document.getElementById('myChart');
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