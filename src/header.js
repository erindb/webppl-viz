'use strict';

module.exports = function(env){

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
    * `values` will always be real numbers if
    * we're plotting pdfs. there might be very few data
    * points, in which case a simple histogram is correct.
    * but there might be too many for that, in which case
    * we should do a binned histogram.
    *
    * at the moment, everything is a binned histogram,
    * even if that's not the most sensible thing to do.
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
    // chart.append("text")
    //     .attr("x", width / 2)
    //     .attr("y", 0)
    //     //.attr("dy", ".75em")
        // .text(function(d) { return category; });
  }

  var heat_map = function(cat1_values, cat2_values, probabilities, container_selector, container_width, container_height, category1, category2) {
    //size of circle is propto score
    //opacity is fairly low

    var data = make_2cat_data(cat1_values, cat2_values, probabilities, category1, category2);
    // console.log(data);

    // overall chart properties, for fitting plot within container
    var width = container_width - margin.left - margin.right;
    var height = container_height - margin.top - margin.bottom;

    // initialize empty chart
    var chart = make_chart(container_selector, margin, width, height);

    // cat1 is on X axis
    var cat1_scale = d3.scale.ordinal()
        .domain(cat1_values)
        .rangeBands([0, width], 0.1);
    var cat1_Axis = d3.svg.axis()
      .scale(cat1_scale)
      .orient("bottom");
    var x_axis_drawn = chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(cat1_Axis);
    x_axis_drawn.append("text")
      .attr("x", width/2)
      .attr("dy", "3em")
      .style("text-anchor", "end")
      .text(category1);

    // cat2 is on Y axis
    var cat2_scale = d3.scale.ordinal()
        .domain(cat2_values)
        .rangeBands([height, 0], 0.1);
    var cat2_Axis = d3.svg.axis()
      .scale(cat2_scale)
      .orient("left");
    var y_axis_drawn = chart.append("g")
      .attr("class", "y axis")
      .call(cat2_Axis);
    y_axis_drawn.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("x", -height/2)
      .attr("dy", "-4em")
      .style("text-anchor", "end")
      .text(category2);

    var minprob = d3.min(probabilities);
    var maxprob = d3.max(probabilities);
    // console.log(probabilities);
    // console.log(_.map(data, function(datum) {return datum.probability;}));
    // console.log(maxprob);
    if (minprob == maxprob) {
      var color_scale = function(prob) {return "steelblue"};
    } else {
      var color_scale = d3.scale.linear()
        .domain([0, maxprob])
        .range(["white", "steelblue"]);
    }

    chart.selectAll(".tile")
      .data(data)
      .enter().append("rect")
      .attr("class", "tile")
      .attr("x", function(d) { return cat1_scale(d[category1]); })
      .attr("width", function(d) { return cat1_scale.rangeBand(); })
      .attr("y", function(d) { return cat2_scale(d[category2]); })
      .attr("height", function(d) { return cat2_scale.rangeBand(); })
      .style("fill", function(d) { return color_scale(d.probability); });
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

  // function isErp(x){
  //   return (x && (x.score != undefined) && (x.sample != undefined));
  // }

  // function isErpWithSupport(x){
  //   return (isErp(x) && (x.support != undefined));
  // }

  function discrete_probability_distribution(values, probabilities, container_selector, container_width, container_height, category){
    /*
    * draw barchart for a discrete probability distribution
    * domain might be strings, booleans, objects, etc.
    */

    // overall chart properties, for fitting plot within container
    var width = container_width - margin.left - margin.right;
    var height = container_height - margin.top - margin.bottom;

    var data = make_data(values, probabilities);

    // initialize empty chart
    var chart = make_chart(container_selector, margin, width, height);

    // extract some useful properties of the data
    var highest_probability = d3.max(probabilities);

    // // x axis should be ordinal
    // var x = d3.scale.ordinal()
    //     .domain(values)
    //     .rangeBands([0, width], 0.1);
    // var x_axis = d3.svg.axis()
    //  .scale(x)
    //  .orient("bottom");
    // var x_axis_drawn = chart.append("g")
    //  .attr("class", "x axis")
    //  .attr("transform", "translate(0," + height + ")")
    //  .call(x_axis);

    // var x = make_x_scale(chart, width, height, 0, highest_probability, "");
    // I kinda want everything to be on the same scale always, so that plots can be compared more easily.
    // this should be an option, but for now, let's do this.
    var x = make_x_scale(chart, width, height, 0, 1, "");

    var y = d3.scale.ordinal()
        .domain(values)
        .rangeBands([height, 0], 0.1);
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
      .text(category);


    // bar.append("rect")
    //     .attr("width", function(d) { return x(d.value); })
    //     .attr("height", barHeight - 1);

    // make histogram bars
    chart.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      // .attr("x", function(d) { return x(d.value); })
      .attr("y", function(d) { return y(d.value); })
      .attr("width", function(d) { return x(d.probability); })
      .attr("height", y.rangeBand());
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
    var first_keys = _.keys(arr[0]);
    if (first_keys.length > 0) {
      //check if same keys all the way through
      for (var i=0; i<arr.length; i++) {
        var ith_keys = _.keys(arr[i]);
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
      // console.log("isNumeric");
      pdf(values, probabilities, container_selector, container_width, container_height, category);
    } else {
      // console.log("is not Numeric");
      discrete_probability_distribution(values, probabilities, container_selector, container_width, container_height, category);
    }
  }

  function vizPrint(store, k, a, x){
    var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
    resultDiv.show();
    // console.log(x);
    // if we can plot things, plot things
    if (isErpWithSupport(x)){
      // console.log("isErpWithSupport");
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
        // console.log("isNiceObject");
        var categories = Object.keys(labels[0]);

        var result_div = d3.select(resultDivSelector);

        for (var i=0; i<categories.length; i++) {
          //marginals
          var category = categories[i];
          var category_data = make_data(labels, counts);
          var values = _.unique(_.map(category_data, function(datum) {return datum.value[category];}));
          var probabilities = _.map(values, function(value) {
            var relevant_data = _.filter(category_data, function(datum) {return datum.value[category] == value;});
            return (_.map(relevant_data, function(datum) { return datum.probability; })).reduce(function(a, b) {
              return a + b;
            });
          });
          var marginal_plot_tag = "marginal_" + category;
          var marginal_div = result_div.append("svg")
            .attr("class", marginal_plot_tag);
          plotSingleVariable(values, probabilities, resultDivSelector + " ." + marginal_plot_tag, graph_width/2, graph_height/2, category);

        }
        for (var i=0; i<categories.length; i++) {
          for (var j=0;j<i; j++) {
            if (i != j) {
              var category1 = categories[i];
              var category2 = categories[j];
              var values1 = labels.map(function(x) {return x[category1];});
              var values2 = labels.map(function(x) {return x[category2];});
              var probabilities = counts;
              // if both numeric, plot scatterplots
              if (isNumeric(values1) & isNumeric(values2)) {
                // first, make container
                // var scattersplot = result_div.append("div")
                //  .attr("class", "scatterplot_container");
                // then, draw a scatterplot
                // var plot_container = scattersplot.append("svg")
                var plot_tag = "scatter_" + category1 + "_" + category2;
                var plot_container = result_div.append("svg")
                  .attr("class", plot_tag);
                scatter(values1, values2, probabilities, resultDivSelector + " ." + plot_tag, graph_width/2, graph_height/2, category1, category2);
              } else if (!isNumeric(values1) & !isNumeric(values2)) {
                // first, we marginalize to these 2 variables only
                var category_data = make_2cat_data(values1, values2, counts, category1, category2);
                var category1values = _.unique(values1);
                var category2values = _.unique(values2);
                var heatmap_probabilities = _.flatten(_.map(category1values, function(cat1val) {
                  return _.map(category2values, function(cat2val) {
                    var relevant_data = _.filter(category_data, function(datum) {
                      return datum[category1] == cat1val & datum[category2] == cat2val;
                    });
                    if (relevant_data.length > 0) {
                      return (_.map(relevant_data, function(datum) { return datum.probability; })).reduce(function(a, b) {
                        return a + b;
                      });
                    } else {
                      return 0;
                    }
                  });
                }));
                var category1values_aligned_with_probs = _.flatten(_.map(category1values, function(cat1val) {
                  return _.map(category2values, function(cat2val) {
                    return cat1val;
                  })
                }));
                var category2values_aligned_with_probs = _.flatten(_.map(category1values, function(cat1val) {
                  return _.map(category2values, function(cat2val) {
                    return cat2val;
                  })
                }));
                // console.log(heatmap_probabilities);
                var plot_tag = "heat_map_" + category1 + "_" + category2;
                var plot_container = result_div.append("svg")
                  .attr("class", plot_tag);
                heat_map(category1values_aligned_with_probs, category2values_aligned_with_probs, heatmap_probabilities,
                  resultDivSelector + " ." + plot_tag, graph_width/2, graph_height/2, category1, category2);
              }
            }
          }
        }
      } else {
        // console.log("is not NiceObject");
        var result_div = d3.select(resultDivSelector);
        var plot_div = result_div.append("svg")
          .attr("class", "single_variable_plot");
        plotSingleVariable(labels, counts, resultDivSelector + " .single_variable_plot", graph_width, graph_height, "")
      }
    } else {
      // console.log("is not ErpWithSupport");
      //otherwise, stringify and print
      resultDiv.append(
      document.createTextNode(
      JSON.stringify(x) + "\n"));
    }
    k(store);
  }

  return {
    vizPrint: vizPrint
  };
}