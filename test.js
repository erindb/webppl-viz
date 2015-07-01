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

function make_chart(selector, width, height, margin) {
	var chart = d3.select(selector);
	chart.attr("width", width + margin.left + margin.right)
	chart.attr("height", height + margin.top + margin.bottom)
	var chartElements = chart.append("g")
	chartElements.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	return chart;
}

function make_bars(chart, data, x, y, width, height, margin) {
	var bar = chart.selectAll(".bar");
	var barUpdate = bar.data(data);

	var barRect = barUpdate.enter().append("rect");
	barRect.attr("class", "bar");
	barRect.attr("x", function(d) { return x(d.name); });
	barRect.attr("y", function(d) { return y(d.value); });
	barRect.attr("height", function(d) { return height - y(d.value); });
	barRect.attr("width", x.rangeBand());

	return bar;
}

function make_y(height, data) {
	var y = d3.scale.linear();
	y.range([height, 0]);
	y.domain([0, d3.max(data, function(d) { return d.value; })]);
	return y;
}

function make_x(width, data) {
	var x = d3.scale.ordinal();
    x.domain(data.map(function(d) { return d.name; }));
    x.rangeBands([0, width]);
    return x;
}
function make_axis(scale, position) {
	var axis = d3.svg.axis();
    axis.scale(scale);
    axis.orient(position);
    return axis;
}
function draw_axes(chart, xAxis, yAxis, height) {
	chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
	chart.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Frequency");
}

$(document).ready(function() {

	// pdf(demo_pdf_data, "demo_pdf", 500, 300);

	var data = [
		{name: "A",    value:  4},
		{name: "B",    value:  8},
		{name: "C",    value: 15},
		{name: "D",    value: 16},
		{name: "E",    value: 23},
		{name: "F",    value: 42}
	];

	var container_width = 500;
	var container_height = 300;

	var margin = {top: 20, right: 30, bottom: 30, left: 40};
    var width = container_width - margin.left - margin.right;
    var height = container_height - margin.top - margin.bottom;

    var x = make_x(width, data);
	var y = make_y(height, data);
	var chart = make_chart(".chart", width, height, margin);
	var bars = make_bars(chart, data, x, y, width, height, margin);

	var xAxis = make_axis(x, "bottom");
	var yAxis = make_axis(y, "left");
	draw_axes(chart, xAxis, yAxis, height);
})