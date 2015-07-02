var demo_pdf_data = [
	{value: .9999, probability: 0.25, category: "A"},
	{value: -.50,  probability: 0.25, category: "A"},
	{value: -.90,  probability: 0.5, category: "A"},
	{value: -10,  probability: 0.5, category: "B"},
	{value: -.20,  probability: 0.5, category: "B"}
]

var make_chart = function(container_selector, margin, width, height) {
	// initialize empty chart
	var chart = d3.select(container_selector)
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		// for all the elements in the chart, move to allow desired margins
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	return chart;
}

var pdf = function(data, container_selector, container_width, container_height) {
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

	var make_x_scale = function(chart, width, height, lowest, highest, position) {
		var x = d3.scale.linear()
			.range([0, width])
			.domain([ lowest, highest ]);
		var x_axis = d3.svg.axis()
			.scale(x)
			.orient("bottom");
		var x_axis_drawn = chart.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(x_axis);
		return x;
	}

	var make_y_scale = function(chart, height, highest_probability) {
		var y = d3.scale.linear()
			.range([height, 0]);
		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left");
		y.domain([0, highest_probability]);
		var y_axis_drawn = chart.append("g")
			.attr("class", "y axis")
			.call(yAxis);
		return y;
	}

	var draw_histogram = function(chart, hist_data, x, y, width, height, n_bins) {
		chart.selectAll(".bar")
			.data(hist_data)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return x(d.value); })
			.attr("y", function(d) { return y(d.probability); })
			.attr("height", function(d) { return height - y(d.probability); })
			.attr("width", width/n_bins);
	}

	var draw_hist = true;
	var draw_density = true;

	// overall chart properties, for fitting plot within container
	var margin = {top: 20, right: 30, bottom: 30, left: 40};
	var width = container_width - margin.left - margin.right;
	var height = container_height - margin.top - margin.bottom;

	// initialize empty chart
	var chart = make_chart(container_selector, margin, width, height);

	// extract some useful properties of the data
	var values = data.map(function(x) {return x.value;});
	var lowest = d3.min(values);
	var highest = d3.max(values);
	var probabilities = data.map(function(x) {return x.probability;});
	var highest_probability = d3.max(probabilities);
	if (draw_hist) {
		// histogram requires binned data
		var n_bins = 20;
		var bin_width = (highest - lowest)/n_bins;
		var hist_data = [];
		for (var i=0; i<n_bins; i++) {
			var total_probability = data.reduce(function(prev,current) {
				if (current.value >= i*bin_width+lowest &
					(current.value < (i+1)*bin_width+lowest |
						(current.value == highest & i == n_bins - 1))) {
					return  +(current.probability) + prev;
				}
				return +prev;
			}, 0);
			if (total_probability > highest_probability) {
				// one of the histogram probabilities might
				// be the highest y value.
				highest_probability = total_probability;
			}
			hist_data.push({
				value: i*bin_width + lowest,
				probability: total_probability
			})
		}
	}
	if (draw_density) {
		// do kernel density estimate
	}

	// x-axis should be continuous, because actual data
	// domain is continuous.
	var x = make_x_scale(chart, width, height, lowest, highest);

	// y-axis should be as tall as necessary for density
	// *and/or* hist plots
	var y = make_y_scale(chart, height, highest_probability)

	// make histogram bars
	if (draw_hist) {
		draw_histogram(chart, hist_data, x, y, width, height, n_bins);
	}
}

$(document).ready(function() {
	pdf(demo_pdf_data, "#pdf_demo", 500, 300);
})