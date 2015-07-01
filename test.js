var demo_pdf_data = [
	{value: -100, score: -1.38629436112, category: "A"},
	{value: -50,  score: -1.38629436112, category: "A"},
	{value: -90,  score: -0.69314718056, category: "A"},
	{value: -10,  score: -0.69314718056, category: "B"},
	{value: -20,  score: -0.69314718056, category: "B"}
]

var pdf = function(data, container, width, height) {
	/*
	* draw histogram and/or density
	* when domain is an interval in R
	*
	* `data` will be a list of samples and scores,
	* possibly with category tags denoting sets that
	* should be graphed together
	*
	* `value` will always be a real number if
	* we're plotting pdfs. there might be very few data
	* points, in which case a simple histogram is correct.
	* but there might be too many for that, in which case
	* we should do a binned histogram.
	*/
}

$(document).ready(function() {

	// pdf(demo_pdf_data, "demo_pdf", 500, 300);

	var data = [
		{name: "Locke",    value:  4},
		{name: "Reyes",    value:  8},
		{name: "Ford",     value: 15},
		{name: "Jarrah",   value: 16},
		{name: "Shephard", value: 23},
		{name: "Kwon",     value: 42}
	];

	var width = 420;
	var barHeight = 20;

	var x = d3.scale.linear();
	x.domain([0, d3.max(data, function(d) {return d.value;})]);
	x.range([0, width]);

	var chart = d3.select(".chart");
	chart.attr("width", width);
	chart.attr("height", barHeight * data.length);

	var bar = chart.selectAll("g");
	var barUpdate = bar.data(data);
	var barEnter = barUpdate.enter().append("g")
	barEnter.attr("transform", function(d, i) {
		return "translate(0," + i * barHeight + ")";
	});

	var barRect = barEnter.append("rect");
	barRect.attr("width", function(d) { return x(d.value); });
	barRect.attr("height", barHeight - 1);

	var barText = barEnter.append("text");
	barText.attr("x", function(d) { return x(d.value) - 3; });
	barText.attr("y", barHeight / 2);
	barText.attr("dy", ".35em");
	barText.text(function(d) { return d.value; });

})