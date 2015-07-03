// overall chart properties, for fitting plot within container
var margin = {top: 20, right: 30, bottom: 30, left: 50};
var graph_width = 500;
var graph_height = 300;

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


var make_x_scale = function(chart, width, height, lowest, highest, label) {
	var x = d3.scale.linear()
		.range([0, width])
		.domain([ lowest, highest ]);
	var x_axis = d3.svg.axis()
		.scale(x)
		.orient("bottom");
	var x_axis_drawn = chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(x_axis)
	x_axis_drawn.append("text")
		.attr("x", width/2)
		.attr("dy", "3em")
		.style("text-anchor", "end")
		.text(label);
	return x;
}

var make_y_scale = function(chart, width, height, lowest, highest, label) {
	var y = d3.scale.linear()
		.range([height, 0])
		.domain([lowest, highest]);
	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
	var y_axis_drawn = chart.append("g")
		.attr("class", "y axis")
		.call(yAxis);
	y_axis_drawn.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("x", -height/2)
		.attr("dy", "-4em")
		.style("text-anchor", "end")
		.text(label);
	return y;
}

var make_data = function(values, probabilities) {
	var data = [];
	for (var i=0; i<values.length; i++) {
		data.push({
			value: values[i],
			probability: probabilities[i]
		})
	}
	return data;
}
var make_2cat_data = function(cat1_values, cat2_values, probabilities, cat1, cat2) {
	var data = [];
	for (var i=0; i<probabilities.length; i++) {
		var datum = {};
		datum[cat1] = cat1_values[i];
		datum[cat2] = cat2_values[i];
		datum["probability"] = probabilities[i];
		data.push(datum);
	}
	return data;
}

var pdf = function(values, probabilities, container_selector, container_width, container_height, category) {
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

	// overall chart properties, for fitting plot within container
	var width = container_width - margin.left - margin.right;
	var height = container_height - margin.top - margin.bottom;

	var data = make_data(values, probabilities);

	// add density option later
	// var draw_hist = true;
	// var draw_density = true;

	// initialize empty chart
	var chart = make_chart(container_selector, margin, width, height);

	// extract some useful properties of the data
	// var values = data.map(function(x) {return x.value;});
	var lowest = d3.min(values);
	var highest = d3.max(values);
	// var probabilities = data.map(function(x) {return x.probability;});
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

	var x = make_x_scale(chart, width, height, lowest, highest, category);
	var y = make_y_scale(chart, width, height, 0, highest_probability, "");

	// make histogram bars
	chart.selectAll(".bar")
		.data(hist_data)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("x", function(d) { return x(d.value); })
		.attr("y", function(d) { return y(d.probability); })
		.attr("height", function(d) { return height - y(d.probability); })
		.attr("width", width/n_bins);
}

var scatter = function(cat1_values, cat2_values, probabilities, container_selector, container_width, container_height, category1, category2) {
	//size of circle is propto score
	//opacity is fairly low

	// overall chart properties, for fitting plot within container
	var width = container_width - margin.left - margin.right;
	var height = container_height - margin.top - margin.bottom;

	// initialize empty chart
	var chart = make_chart(container_selector, margin, width, height);

	var data = make_2cat_data(cat1_values, cat2_values, probabilities, category1, category2);

	// var cat1_values = data.map(function(x) {return x[category1];});
	var cat1_lowest = d3.min(cat1_values);
	var cat1_highest = d3.max(cat1_values);
	var cat1_scale = make_x_scale(chart, width, height, cat1_lowest, cat1_highest, category1);

	// var cat2_values = data.map(function(x) {return x[category2];});
	var cat2_lowest = d3.min(cat2_values);
	var cat2_highest = d3.max(cat2_values);
	var cat2_scale = make_y_scale(chart, width, height, cat2_lowest, cat2_highest, category2);

	var probability_scale_factor = 1/d3.min(probabilities);

	chart.selectAll(".dot")
		.data(data)
		.enter().append("circle")
		.attr("class", "dot")
		.attr("r", function(d) { return d.probability*probability_scale_factor; })
		.attr("cx", function(d) { return cat1_scale(d[category1]); })
		.attr("cy", function(d) { return cat2_scale(d[category2]); })
		.style("fill", "steelblue")
}

function isErp(x){
  return (x && (x.score != undefined) && (x.sample != undefined));
}

function isErpWithSupport(x){
  return (isErp(x) && (x.support != undefined));
}

function barChart(values, probabilities, container_selector, container_width, container_height, category){
  $(container_selector).show();
  var svg = d3.select(container_selector)
    .append("svg")
    .attr("class", "barChart");
  var data = [];
  for (var i=0; i<labels.length; i++){
    if (counts[i] > 0) {
      data.push({
        "Value": JSON.stringify(labels[i]),
        "Probability": counts[i]
      });
    }
  };
  var chart = new dimple.chart(svg, data);
  chart.setBounds(margin.left, margin.top, container_width, container_height);
  var xAxis = chart.addMeasureAxis("x", "Probability");
  xAxis.title = null;
  xAxis.tickFormat = ",.2f";
  var yAxis = chart.addCategoryAxis("y", "Value");
  yAxis.title = null;
  chart.addSeries("Probability", dimple.plot.bar);
  chart.draw();
}

function isNumeric(arr) {
	for(var i=0; i<arr.length; i++) {
		var n = arr[i];
		var is_num = !isNaN(parseFloat(n)) && isFinite(n);
		if (!is_num) {
			return false;
		}
	}
	return true;
}

function isNiceObject(arr) {
	var first_keys = Object.keys(arr[0]);
	if (first_keys.length > 0) {
		//check if same keys all the way through
		for (var i=0; i<arr.length; i++) {
			var ith_keys = Object.keys(arr[i]);
			for (var j=0; j<arr.length; j++) {
				if (ith_keys[j] != first_keys[j]) {
					return false;
				}
			}
		}
		return true;
	} else {
		return false;
	}
}

function plotSingleVariable(values, probabilities, container_selector, container_width, container_height, category) {
	if (isNumeric(values)) {
		pdf(values, probabilities, container_selector, container_width, container_height, category);
	} else {
		barChart(values, probabilities, container_selector, container_width, container_height, category);
	}
}

function jsPrint(x){
	var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
	resultDiv.show();
	// if we can plot things, plot things
	if (isErpWithSupport(x)){
		var params = Array.prototype.slice.call(arguments, 2);
		var labels = x.support(params);
		var scores = _.map(labels, function(label){return x.score(params, label);});
		if (_.find(scores, isNaN) !== undefined){
			resultDiv.append(document.createTextNode("ERP with NaN scores!\n"));
			return;
		}
		var counts = scores.map(Math.exp);
		var resultDivSelector = "#" + resultDiv.attr('id');

		// // what kind of plot should I show?
		if (isNiceObject(labels)) {
			var categories = Object.keys(labels[0]);
			for (var i=0; i<categories.length; i++) {
				for (var j=0;j<categories.length; j++) {
					if (i != j) {
						var category1 = categories[i];
						var category2 = categories[j];
						var values1 = labels.map(function(x) {return x[category1];});
						var values2 = labels.map(function(x) {return x[category2];});
						var probabilities = [];
						// if both numeric, plot scatterplots
						if (isNumeric(values1) & isNumeric(values2)) {
							// first, make container
							var scattersplot = result_div.append("div")
								.attr("class", "scatterplot_container");
							// then, draw a scatterplot
							var plot_tag = "scatterplot_" + category1 + "_" + category2;
							var plot_container = scatters.append("svg")
								.attr("class", plot_tag);
							scatter(cat1_values, cat2_values, probabilities, "." + plot_tag, graph_width/2, graph_height/2, category1, category2);
						}
						//plot marginals
						// var result_div = d3.select(resultDivSelector);
						// var marginals = result_div.append("div")
						// 	.attr("class", "marginals");
						// marginals.append("div")
						// 	.attr("class", "plot_header")
						// 	.text("Marginal Distributions");
					}
				}
			}
		} else {
			plotSingleVariable(labels, counts, resultDivSelector, graph_width, graph_height, "")
		}
	} else {
		//otherwise, stringify and print
		resultDiv.append(
		document.createTextNode(
		JSON.stringify(x) + "\n"));
	}
}

var viz = {
	plot: function(store, k, a, x) {
		jsPrint(x);
		return k(store);
	}
}

$(document).ready(function() {

	var demo_pdf_data = [{"value":-1.697814075014557,"probability":0.009999999999999993,"category":"X"},{"value":1.2211941363037158,"probability":0.009999999999999993,"category":"X"},{"value":-0.07076719810510244,"probability":0.009999999999999993,"category":"X"},{"value":0.3786750990838677,"probability":0.009999999999999993,"category":"X"},{"value":0.23791224107111028,"probability":0.009999999999999993,"category":"X"},{"value":-0.711299219728628,"probability":0.009999999999999993,"category":"X"},{"value":-0.4901977504244346,"probability":0.009999999999999993,"category":"X"},{"value":-0.502038223612587,"probability":0.009999999999999993,"category":"X"},{"value":0.14882617425323558,"probability":0.009999999999999993,"category":"X"},{"value":2.836666468247921,"probability":0.009999999999999993,"category":"X"},{"value":0.584799653977451,"probability":0.009999999999999993,"category":"X"},{"value":-0.7782684889287019,"probability":0.009999999999999993,"category":"X"},{"value":-2.158666099709926,"probability":0.009999999999999993,"category":"X"},{"value":0.5385532944606823,"probability":0.009999999999999993,"category":"X"},{"value":-0.1877656844640754,"probability":0.009999999999999993,"category":"X"},{"value":0.8144273908301931,"probability":0.009999999999999993,"category":"X"},{"value":1.1348311288355541,"probability":0.009999999999999993,"category":"X"},{"value":1.0638785444480403,"probability":0.009999999999999993,"category":"X"},{"value":-1.4272579434259705,"probability":0.009999999999999993,"category":"X"},{"value":0.08621758914930701,"probability":0.009999999999999993,"category":"X"},{"value":-0.19848786459487958,"probability":0.009999999999999993,"category":"X"},{"value":0.25818678419173297,"probability":0.009999999999999993,"category":"X"},{"value":-0.5580236274006601,"probability":0.009999999999999993,"category":"X"},{"value":0.71581025273096,"probability":0.009999999999999993,"category":"X"},{"value":-0.7982359857519792,"probability":0.009999999999999993,"category":"X"},{"value":-1.7326339223747595,"probability":0.009999999999999993,"category":"X"},{"value":0.7020136516666005,"probability":0.009999999999999993,"category":"X"},{"value":0.4326562209141237,"probability":0.009999999999999993,"category":"X"},{"value":-0.7211820339270429,"probability":0.009999999999999993,"category":"X"},{"value":-0.23333068880846317,"probability":0.009999999999999993,"category":"X"},{"value":1.9759334073105126,"probability":0.009999999999999993,"category":"X"},{"value":-0.869438399740399,"probability":0.009999999999999993,"category":"X"},{"value":-0.542762727683903,"probability":0.009999999999999993,"category":"X"},{"value":-0.40984537848093194,"probability":0.009999999999999993,"category":"X"},{"value":0.0761585927997492,"probability":0.009999999999999993,"category":"X"},{"value":1.54285818563671,"probability":0.009999999999999993,"category":"X"},{"value":0.3705005768613529,"probability":0.009999999999999993,"category":"X"},{"value":-0.00478714864459701,"probability":0.009999999999999993,"category":"X"},{"value":-1.3370743738020374,"probability":0.009999999999999993,"category":"X"},{"value":0.013097759521521469,"probability":0.009999999999999993,"category":"X"},{"value":0.41175064832568775,"probability":0.009999999999999993,"category":"X"},{"value":0.2500032803625436,"probability":0.009999999999999993,"category":"X"},{"value":-0.17873009035385698,"probability":0.009999999999999993,"category":"X"},{"value":-0.021061517411252836,"probability":0.009999999999999993,"category":"X"},{"value":-1.3301613862914807,"probability":0.009999999999999993,"category":"X"},{"value":0.14186556127238134,"probability":0.009999999999999993,"category":"X"},{"value":-1.622789745056484,"probability":0.009999999999999993,"category":"X"},{"value":-0.5267597654721848,"probability":0.009999999999999993,"category":"X"},{"value":-2.397502208052367,"probability":0.009999999999999993,"category":"X"},{"value":-0.49647682063479776,"probability":0.009999999999999993,"category":"X"},{"value":-0.35387511721778864,"probability":0.009999999999999993,"category":"X"},{"value":-0.033348721796181716,"probability":0.009999999999999993,"category":"X"},{"value":-0.15276691038107681,"probability":0.009999999999999993,"category":"X"},{"value":-0.8405132678144691,"probability":0.009999999999999993,"category":"X"},{"value":-0.9129503827737829,"probability":0.009999999999999993,"category":"X"},{"value":-0.5836684246954104,"probability":0.009999999999999993,"category":"X"},{"value":-1.3222188601592497,"probability":0.009999999999999993,"category":"X"},{"value":-0.48235145651899314,"probability":0.009999999999999993,"category":"X"},{"value":0.7189696567531205,"probability":0.009999999999999993,"category":"X"},{"value":1.5002518111444958,"probability":0.009999999999999993,"category":"X"},{"value":-0.7398874841149261,"probability":0.009999999999999993,"category":"X"},{"value":-0.54160697263004,"probability":0.009999999999999993,"category":"X"},{"value":-0.1258909764588316,"probability":0.009999999999999993,"category":"X"},{"value":0.6646891884854458,"probability":0.009999999999999993,"category":"X"},{"value":-0.6109603718214501,"probability":0.009999999999999993,"category":"X"},{"value":0.27782249394777436,"probability":0.009999999999999993,"category":"X"},{"value":-0.6009785119385328,"probability":0.009999999999999993,"category":"X"},{"value":0.5323713825301769,"probability":0.009999999999999993,"category":"X"},{"value":0.1775667364369185,"probability":0.009999999999999993,"category":"X"},{"value":0.0766445921900761,"probability":0.009999999999999993,"category":"X"},{"value":-1.7083092802711262,"probability":0.009999999999999993,"category":"X"},{"value":0.32646505875903215,"probability":0.009999999999999993,"category":"X"},{"value":0.9276795476486178,"probability":0.009999999999999993,"category":"X"},{"value":1.4172299605737657,"probability":0.009999999999999993,"category":"X"},{"value":-2.5455513785737254,"probability":0.009999999999999993,"category":"X"},{"value":-1.0668509284062422,"probability":0.009999999999999993,"category":"X"},{"value":-0.8334807520450407,"probability":0.009999999999999993,"category":"X"},{"value":1.7485257723043997,"probability":0.009999999999999993,"category":"X"},{"value":-0.4332159497978516,"probability":0.009999999999999993,"category":"X"},{"value":0.8482528730686094,"probability":0.009999999999999993,"category":"X"},{"value":-0.7207241998269184,"probability":0.009999999999999993,"category":"X"},{"value":0.5844541115240739,"probability":0.009999999999999993,"category":"X"},{"value":1.7633165054431614,"probability":0.009999999999999993,"category":"X"},{"value":2.313279063123623,"probability":0.009999999999999993,"category":"X"},{"value":-0.7533589100989826,"probability":0.009999999999999993,"category":"X"},{"value":-0.721171920667135,"probability":0.009999999999999993,"category":"X"},{"value":-2.5500636596033988,"probability":0.009999999999999993,"category":"X"},{"value":-1.735776835624014,"probability":0.009999999999999993,"category":"X"},{"value":-1.479226131851179,"probability":0.009999999999999993,"category":"X"},{"value":1.0580905640432978,"probability":0.009999999999999993,"category":"X"},{"value":-0.9212751942964265,"probability":0.009999999999999993,"category":"X"},{"value":1.1632319564376286,"probability":0.009999999999999993,"category":"X"},{"value":0.07488528995142457,"probability":0.009999999999999993,"category":"X"},{"value":-1.0625622129652892,"probability":0.009999999999999993,"category":"X"},{"value":-0.4532785399574269,"probability":0.009999999999999993,"category":"X"},{"value":0.20513281957784124,"probability":0.009999999999999993,"category":"X"},{"value":0.5083070344423004,"probability":0.009999999999999993,"category":"X"},{"value":-1.3771017452055245,"probability":0.009999999999999993,"category":"X"},{"value":0.6839375060615026,"probability":0.009999999999999993,"category":"X"},{"value":1.1471777692989782,"probability":0.009999999999999993,"category":"X"},{"value":-3.3937480596094693,"probability":0.009999999999999993,"category":"Y"},{"value":0.44785819025046636,"probability":0.009999999999999993,"category":"Y"},{"value":0.18776665716265872,"probability":0.009999999999999993,"category":"Y"},{"value":0.13386992334779305,"probability":0.009999999999999993,"category":"Y"},{"value":0.4433049428207515,"probability":0.009999999999999993,"category":"Y"},{"value":-0.1738858298458466,"probability":0.009999999999999993,"category":"Y"},{"value":-1.7817879038781745,"probability":0.009999999999999993,"category":"Y"},{"value":4.281191205876704,"probability":0.009999999999999993,"category":"Y"},{"value":-2.4144064459449655,"probability":0.009999999999999993,"category":"Y"},{"value":-1.636346123261994,"probability":0.009999999999999993,"category":"Y"},{"value":0.3701773536866339,"probability":0.009999999999999993,"category":"Y"},{"value":-2.0959260951011767,"probability":0.009999999999999993,"category":"Y"},{"value":-3.022568888100074,"probability":0.009999999999999993,"category":"Y"},{"value":1.3469385098676836,"probability":0.009999999999999993,"category":"Y"},{"value":2.3611746083752854,"probability":0.009999999999999993,"category":"Y"},{"value":-5.106076799401085,"probability":0.009999999999999993,"category":"Y"},{"value":0.2076647067183512,"probability":0.009999999999999993,"category":"Y"},{"value":-3.267013235184111,"probability":0.009999999999999993,"category":"Y"},{"value":-2.9012527866939686,"probability":0.009999999999999993,"category":"Y"},{"value":-1.4219303364029652,"probability":0.009999999999999993,"category":"Y"},{"value":-1.5825521623044811,"probability":0.009999999999999993,"category":"Y"},{"value":-1.7386306171559307,"probability":0.009999999999999993,"category":"Y"},{"value":0.9601703504161203,"probability":0.009999999999999993,"category":"Y"},{"value":3.181000559254967,"probability":0.009999999999999993,"category":"Y"},{"value":-2.2180038712495653,"probability":0.009999999999999993,"category":"Y"},{"value":1.4789832367929492,"probability":0.009999999999999993,"category":"Y"},{"value":-0.01572871684724794,"probability":0.009999999999999993,"category":"Y"},{"value":0.2055534907693989,"probability":0.009999999999999993,"category":"Y"},{"value":1.5082609620522367,"probability":0.009999999999999993,"category":"Y"},{"value":2.3533317744022377,"probability":0.009999999999999993,"category":"Y"},{"value":0.423381130961867,"probability":0.009999999999999993,"category":"Y"},{"value":-3.289310421299187,"probability":0.009999999999999993,"category":"Y"},{"value":-1.3885199834049087,"probability":0.009999999999999993,"category":"Y"},{"value":-2.2943192743167646,"probability":0.009999999999999993,"category":"Y"},{"value":1.9440908670616792,"probability":0.009999999999999993,"category":"Y"},{"value":-0.6821798153489065,"probability":0.009999999999999993,"category":"Y"},{"value":-0.752066888485845,"probability":0.009999999999999993,"category":"Y"},{"value":0.8475960529554004,"probability":0.009999999999999993,"category":"Y"},{"value":-0.8798095849366608,"probability":0.009999999999999993,"category":"Y"},{"value":-1.4807148288043883,"probability":0.009999999999999993,"category":"Y"},{"value":0.20371785341183327,"probability":0.009999999999999993,"category":"Y"},{"value":6.40708538717297,"probability":0.009999999999999993,"category":"Y"},{"value":0.8821295538611053,"probability":0.009999999999999993,"category":"Y"},{"value":1.2976376221882244,"probability":0.009999999999999993,"category":"Y"},{"value":3.843499297554071,"probability":0.009999999999999993,"category":"Y"},{"value":-0.9714064550990702,"probability":0.009999999999999993,"category":"Y"},{"value":1.3372545400785647,"probability":0.009999999999999993,"category":"Y"},{"value":1.0533817744022795,"probability":0.009999999999999993,"category":"Y"},{"value":-2.12780925910906,"probability":0.009999999999999993,"category":"Y"},{"value":2.123389191416032,"probability":0.009999999999999993,"category":"Y"},{"value":-3.344087768222561,"probability":0.009999999999999993,"category":"Y"},{"value":2.9752396516956185,"probability":0.009999999999999993,"category":"Y"},{"value":6.6933816728180195,"probability":0.009999999999999993,"category":"Y"},{"value":-0.1465400521760666,"probability":0.009999999999999993,"category":"Y"},{"value":-0.016313274156600267,"probability":0.009999999999999993,"category":"Y"},{"value":-0.6088535131937218,"probability":0.009999999999999993,"category":"Y"},{"value":3.1255228593270905,"probability":0.009999999999999993,"category":"Y"},{"value":-0.8102328048597006,"probability":0.009999999999999993,"category":"Y"},{"value":1.3167110142056264,"probability":0.009999999999999993,"category":"Y"},{"value":2.39184656030642,"probability":0.009999999999999993,"category":"Y"},{"value":-1.5624422695752382,"probability":0.009999999999999993,"category":"Y"},{"value":-2.385842026572761,"probability":0.009999999999999993,"category":"Y"},{"value":-2.6858831941616255,"probability":0.009999999999999993,"category":"Y"},{"value":3.171952401478498,"probability":0.009999999999999993,"category":"Y"},{"value":-0.050448231067973526,"probability":0.009999999999999993,"category":"Y"},{"value":2.0073016876611294,"probability":0.009999999999999993,"category":"Y"},{"value":-4.810657117561379,"probability":0.009999999999999993,"category":"Y"},{"value":1.9434820567076558,"probability":0.009999999999999993,"category":"Y"},{"value":-0.11756695596270554,"probability":0.009999999999999993,"category":"Y"},{"value":0.5636589236803763,"probability":0.009999999999999993,"category":"Y"},{"value":0.6498046593154209,"probability":0.009999999999999993,"category":"Y"},{"value":2.3066723926888093,"probability":0.009999999999999993,"category":"Y"},{"value":2.7543485156708005,"probability":0.009999999999999993,"category":"Y"},{"value":3.7711075673800742,"probability":0.009999999999999993,"category":"Y"},{"value":1.0970119005859318,"probability":0.009999999999999993,"category":"Y"},{"value":-1.3814108313502937,"probability":0.009999999999999993,"category":"Y"},{"value":-1.324517640099146,"probability":0.009999999999999993,"category":"Y"},{"value":-0.42537831434088497,"probability":0.009999999999999993,"category":"Y"},{"value":-0.5456780356916533,"probability":0.009999999999999993,"category":"Y"},{"value":-0.7641371984123984,"probability":0.009999999999999993,"category":"Y"},{"value":-3.2224822175927597,"probability":0.009999999999999993,"category":"Y"},{"value":-1.5220883494570197,"probability":0.009999999999999993,"category":"Y"},{"value":0.3210798110965268,"probability":0.009999999999999993,"category":"Y"},{"value":4.1331750651200165,"probability":0.009999999999999993,"category":"Y"},{"value":0.5936674200421104,"probability":0.009999999999999993,"category":"Y"},{"value":-0.5068133525726367,"probability":0.009999999999999993,"category":"Y"},{"value":2.13369799094013,"probability":0.009999999999999993,"category":"Y"},{"value":-5.952243703910916,"probability":0.009999999999999993,"category":"Y"},{"value":1.6454000389688217,"probability":0.009999999999999993,"category":"Y"},{"value":0.6982161533184903,"probability":0.009999999999999993,"category":"Y"},{"value":1.5467068678103337,"probability":0.009999999999999993,"category":"Y"},{"value":2.478527863340123,"probability":0.009999999999999993,"category":"Y"},{"value":1.803618306892173,"probability":0.009999999999999993,"category":"Y"},{"value":-2.152527038985942,"probability":0.009999999999999993,"category":"Y"},{"value":1.7032742222911215,"probability":0.009999999999999993,"category":"Y"},{"value":-1.8064627771994581,"probability":0.009999999999999993,"category":"Y"},{"value":-1.1905174745977054,"probability":0.009999999999999993,"category":"Y"},{"value":3.2023426877891654,"probability":0.009999999999999993,"category":"Y"},{"value":0.5831106694635818,"probability":0.009999999999999993,"category":"Y"},{"value":0.4040382881833842,"probability":0.009999999999999993,"category":"Y"}]

	var plot_div = d3.select("#plot_demo");
	var marginals = plot_div.append("div")
		.attr("class", "marginals");
	var scatters = plot_div.append("div")
		.attr("class", "scatters");
	marginals.append("div")
		.attr("class", "plot_header")
		.text("Marginal Distributions");
	scatters.append("div")
		.attr("class", "plot_header")
		.text("Scatter Plots");

	categories = [];
	for (var i=0; i<demo_pdf_data.length; i++) {
		var cat = demo_pdf_data[i].category;
		if (categories.indexOf(cat) < 0) {
			categories.push(cat);
		}
	}
	for (var i=0; i<categories.length; i++) {
		var category = categories[i];
		var data = demo_pdf_data.filter(function(x) {
			return x.category == category;
		})
		var plot_container = marginals.append("svg")
			.attr("id", "pdf_demo_" + category);
		var values = data.map(function(x) {return x.value;});
		var probabilities = data.map(function(x) {return x.probability});
		pdf(values, probabilities, "#pdf_demo_" + category, 500, 150, category);
	}

	var scatter_data = [{"X":-1.697814075014557,"Y":-3.3937480596094693,"probability":0.010000000000000002},{"X":0.6839375060615026,"Y":0.5831106694635818,"probability":0.010000000000000002},{"X":1.2211941363037158,"Y":0.44785819025046636,"probability":0.010000000000000002},{"X":1.1471777692989782,"Y":0.4040382881833842,"probability":0.010000000000000002},{"X":-1.3771017452055245,"Y":3.2023426877891654,"probability":0.010000000000000002},{"X":0.20513281957784124,"Y":-1.8064627771994581,"probability":0.010000000000000002},{"X":-0.07076719810510244,"Y":0.18776665716265872,"probability":0.010000000000000002},{"X":0.5083070344423004,"Y":-1.1905174745977054,"probability":0.010000000000000002},{"X":-0.4532785399574269,"Y":1.7032742222911215,"probability":0.010000000000000002},{"X":-1.0625622129652892,"Y":-2.152527038985942,"probability":0.010000000000000002},{"X":0.07488528995142457,"Y":1.803618306892173,"probability":0.010000000000000002},{"X":1.1632319564376286,"Y":2.478527863340123,"probability":0.010000000000000002},{"X":-0.9212751942964265,"Y":1.5467068678103337,"probability":0.010000000000000002},{"X":-1.479226131851179,"Y":1.6454000389688217,"probability":0.010000000000000002},{"X":0.3786750990838677,"Y":0.13386992334779305,"probability":0.010000000000000002},{"X":1.0580905640432978,"Y":0.6982161533184903,"probability":0.010000000000000002},{"X":-1.735776835624014,"Y":-5.952243703910916,"probability":0.010000000000000002},{"X":-2.5500636596033988,"Y":2.13369799094013,"probability":0.010000000000000002},{"X":-0.721171920667135,"Y":-0.5068133525726367,"probability":0.010000000000000002},{"X":-0.7533589100989826,"Y":0.5936674200421104,"probability":0.010000000000000002},{"X":2.313279063123623,"Y":4.1331750651200165,"probability":0.010000000000000002},{"X":1.7633165054431614,"Y":0.3210798110965268,"probability":0.010000000000000002},{"X":0.5844541115240739,"Y":-1.5220883494570197,"probability":0.010000000000000002},{"X":-0.7207241998269184,"Y":-3.2224822175927597,"probability":0.010000000000000002},{"X":0.8482528730686094,"Y":-0.7641371984123984,"probability":0.010000000000000002},{"X":-0.4332159497978516,"Y":-0.5456780356916533,"probability":0.010000000000000002},{"X":1.7485257723043997,"Y":-0.42537831434088497,"probability":0.010000000000000002},{"X":-0.8334807520450407,"Y":-1.324517640099146,"probability":0.010000000000000002},{"X":-1.0668509284062422,"Y":-1.3814108313502937,"probability":0.010000000000000002},{"X":1.4172299605737657,"Y":3.7711075673800742,"probability":0.010000000000000002},{"X":0.23791224107111028,"Y":0.4433049428207515,"probability":0.010000000000000002},{"X":-2.5455513785737254,"Y":1.0970119005859318,"probability":0.010000000000000002},{"X":0.9276795476486178,"Y":2.7543485156708005,"probability":0.010000000000000002},{"X":0.32646505875903215,"Y":2.3066723926888093,"probability":0.010000000000000002},{"X":-1.7083092802711262,"Y":0.6498046593154209,"probability":0.010000000000000002},{"X":0.0766445921900761,"Y":0.5636589236803763,"probability":0.010000000000000002},{"X":0.1775667364369185,"Y":-0.11756695596270554,"probability":0.010000000000000002},{"X":0.5323713825301769,"Y":1.9434820567076558,"probability":0.010000000000000002},{"X":-0.6009785119385328,"Y":-4.810657117561379,"probability":0.010000000000000002},{"X":0.27782249394777436,"Y":2.0073016876611294,"probability":0.010000000000000002},{"X":-0.6109603718214501,"Y":-0.050448231067973526,"probability":0.010000000000000002},{"X":0.6646891884854458,"Y":3.171952401478498,"probability":0.010000000000000002},{"X":-0.1258909764588316,"Y":-2.6858831941616255,"probability":0.010000000000000002},{"X":-0.54160697263004,"Y":-2.385842026572761,"probability":0.010000000000000002},{"X":-0.7398874841149261,"Y":-1.5624422695752382,"probability":0.010000000000000002},{"X":1.5002518111444958,"Y":2.39184656030642,"probability":0.010000000000000002},{"X":0.7189696567531205,"Y":1.3167110142056264,"probability":0.010000000000000002},{"X":-0.48235145651899314,"Y":-0.8102328048597006,"probability":0.010000000000000002},{"X":-1.3222188601592497,"Y":3.1255228593270905,"probability":0.010000000000000002},{"X":-0.5836684246954104,"Y":-0.6088535131937218,"probability":0.010000000000000002},{"X":-0.9129503827737829,"Y":-0.016313274156600267,"probability":0.010000000000000002},{"X":-0.8405132678144691,"Y":-0.1465400521760666,"probability":0.010000000000000002},{"X":-0.15276691038107681,"Y":6.6933816728180195,"probability":0.010000000000000002},{"X":-0.033348721796181716,"Y":2.9752396516956185,"probability":0.010000000000000002},{"X":-0.35387511721778864,"Y":-3.344087768222561,"probability":0.010000000000000002},{"X":-0.49647682063479776,"Y":2.123389191416032,"probability":0.010000000000000002},{"X":-2.397502208052367,"Y":-2.12780925910906,"probability":0.010000000000000002},{"X":-0.5267597654721848,"Y":1.0533817744022795,"probability":0.010000000000000002},{"X":-1.622789745056484,"Y":1.3372545400785647,"probability":0.010000000000000002},{"X":0.14186556127238134,"Y":-0.9714064550990702,"probability":0.010000000000000002},{"X":-1.3301613862914807,"Y":3.843499297554071,"probability":0.010000000000000002},{"X":-0.17873009035385698,"Y":0.8821295538611053,"probability":0.010000000000000002},{"X":-0.711299219728628,"Y":-0.1738858298458466,"probability":0.010000000000000002},{"X":-0.021061517411252836,"Y":1.2976376221882244,"probability":0.010000000000000002},{"X":0.2500032803625436,"Y":6.40708538717297,"probability":0.010000000000000002},{"X":0.41175064832568775,"Y":0.20371785341183327,"probability":0.010000000000000002},{"X":0.013097759521521469,"Y":-1.4807148288043883,"probability":0.010000000000000002},{"X":-1.3370743738020374,"Y":-0.8798095849366608,"probability":0.010000000000000002},{"X":-0.00478714864459701,"Y":0.8475960529554004,"probability":0.010000000000000002},{"X":0.3705005768613529,"Y":-0.752066888485845,"probability":0.010000000000000002},{"X":1.54285818563671,"Y":-0.6821798153489065,"probability":0.010000000000000002},{"X":0.0761585927997492,"Y":1.9440908670616792,"probability":0.010000000000000002},{"X":-0.40984537848093194,"Y":-2.2943192743167646,"probability":0.010000000000000002},{"X":-0.542762727683903,"Y":-1.3885199834049087,"probability":0.010000000000000002},{"X":-0.869438399740399,"Y":-3.289310421299187,"probability":0.010000000000000002},{"X":1.9759334073105126,"Y":0.423381130961867,"probability":0.010000000000000002},{"X":-0.23333068880846317,"Y":2.3533317744022377,"probability":0.010000000000000002},{"X":-0.7211820339270429,"Y":1.5082609620522367,"probability":0.010000000000000002},{"X":0.4326562209141237,"Y":0.2055534907693989,"probability":0.010000000000000002},{"X":0.7020136516666005,"Y":-0.01572871684724794,"probability":0.010000000000000002},{"X":-1.7326339223747595,"Y":1.4789832367929492,"probability":0.010000000000000002},{"X":-0.7982359857519792,"Y":-2.2180038712495653,"probability":0.010000000000000002},{"X":0.71581025273096,"Y":3.181000559254967,"probability":0.010000000000000002},{"X":-0.5580236274006601,"Y":0.9601703504161203,"probability":0.010000000000000002},{"X":0.25818678419173297,"Y":-1.7386306171559307,"probability":0.010000000000000002},{"X":-0.19848786459487958,"Y":-1.5825521623044811,"probability":0.010000000000000002},{"X":0.08621758914930701,"Y":-1.4219303364029652,"probability":0.010000000000000002},{"X":-1.4272579434259705,"Y":-2.9012527866939686,"probability":0.010000000000000002},{"X":1.0638785444480403,"Y":-3.267013235184111,"probability":0.010000000000000002},{"X":1.1348311288355541,"Y":0.2076647067183512,"probability":0.010000000000000002},{"X":0.8144273908301931,"Y":-5.106076799401085,"probability":0.010000000000000002},{"X":-0.1877656844640754,"Y":2.3611746083752854,"probability":0.010000000000000002},{"X":0.5385532944606823,"Y":1.3469385098676836,"probability":0.010000000000000002},{"X":-2.158666099709926,"Y":-3.022568888100074,"probability":0.010000000000000002},{"X":-0.7782684889287019,"Y":-2.0959260951011767,"probability":0.010000000000000002},{"X":0.584799653977451,"Y":0.3701773536866339,"probability":0.010000000000000002},{"X":2.836666468247921,"Y":-1.636346123261994,"probability":0.010000000000000002},{"X":0.14882617425323558,"Y":-2.4144064459449655,"probability":0.010000000000000002},{"X":-0.502038223612587,"Y":4.281191205876704,"probability":0.010000000000000002},{"X":-0.4901977504244346,"Y":-1.7817879038781745,"probability":0.010000000000000002}];

	var cats = ["X", "Y"];

	for (var i=0; i<cats.length; i++) {
		var category1 = cats[i];
		for (var j=0; j<i; j++) {
			var category2 = cats[j];
			if (category1 != category2) {
				//draw a scatterplot
				//size is propto score
				//opacity is fairly low
				var plot_tag = "scatter_demo_" + category1 + "_" + category2;
				var plot_container = scatters.append("svg")
					.attr("id", plot_tag);
				var cat1_values = scatter_data.map(function(x) {return x[category1];});
				var cat2_values = scatter_data.map(function(x) {return x[category2];});
				var probabilities = scatter_data.map(function(x) {return x.probability;});
				scatter(cat1_values, cat2_values, probabilities, "#" + plot_tag, 500, 150, category1, category2);
			}
		}
	}
})