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

	var draw_histogram = function(chart, data, x, width, height) {

		var probabilities = data.map(function(x) {return x.probability;});
		var highest_probability = d3.max(probabilities);

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

		var y = d3.scale.linear()
			.range([height, 0]);
		y.domain([0, highest_probability]);

		chart.selectAll(".bar")
			.data(hist_data)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return x(d.value); })
			.attr("y", function(d) { return y(d.probability); })
			.attr("height", function(d) { return height - y(d.probability); })
			.attr("width", width/n_bins);
	}

	var draw_density_plot = function(chart, height, data, x) {	
		var densify_data = function(data) {
			var values = data.map(function(x) {return x.value;});
			var lowest = d3.min(values);
			var highest = d3.max(values);

			// do kernel density estimate
			// highest_probability = ...
			var density_data = [];

			function epanechnikovKernel(u) {
				return Math.abs(u) <= 1 ? .75 * (1 - u * u) : 0;
			}

			// get optimal bandwidth
			// HT http://en.wikipedia.org/wiki/Kernel_density_estimation#Practical_estimation_of_the_bandwidth
			// var mean = erp.expectation();
			var n = data.length; // this is too low
			var mean = data.reduce(function(acc, x) {
				return acc + (x.probability * x.value);
			}, 0);
			var sd = Math.sqrt(data.reduce(function(acc, x) {
				return acc + (x.probability * Math.pow(x.value - mean, 2));
			}, 0));

			var bandwidth = 1.06 * sd * Math.pow(n, -0.2);

			var numBins = (highest - lowest) / bandwidth;

			for (var i = 0; i <= numBins; i++) {
				var x = lowest + bandwidth * i;
				var kernel_sum = 0;
				for (var j = 0; j < data.length; j++) {
					var datum = data[j];
					kernel_sum += epanechnikovKernel((x - datum.value) / bandwidth) * datum.probability;
				}
				density_data.push({
					value: x,
					probability: kernel_sum / (n * bandwidth)
					});
			}
			return density_data;
		}
		var density_data = densify_data(data);
		var y_density = d3.scale.linear()
			.range([height, 0]);
		y_density.domain([0, d3.max(density_data.map(function(x) {return x.probability;}))]);
		var line = d3.svg.line()
		    .x(function(d) { return x(d.value); })
		    .y(function(d) { return y_density(d.probability); });
		chart.append("path")
	    	.datum(density_data)
	    	.attr("class", "line")
			.attr("d", line);
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

	// x-axis should be continuous, because actual data
	// domain is continuous.
	var x = make_x_scale(chart, width, height, lowest, highest);

	// make histogram bars
	if (draw_hist) {
		draw_histogram(chart, data, x, width, height);
	}
	if (draw_density) {
		draw_density_plot(chart, height, data, x)
	}

}

$(document).ready(function() {
	pdf(demo_pdf_data, "#pdf_demo", 500, 300);
})