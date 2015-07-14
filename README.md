Some visualization functions for webppl:

* `vizPrint` takes an ERP and makes a sort of reasonable set of plots.

To compile `webppl.min.js` to include these functions:

~~~
cd webppl
browserify -t [./src/bundle.js --require ../webppl-viz] -t brfs src/browser.js > webppl.js
uglifyjs webppl.js > webppl.min.js
~~~

See [index.html](http://web.stanford.edu/~erindb/webppl-viz/) for examples.