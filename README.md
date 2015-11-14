Some visualization functions for webppl:

* `vizPrint` takes an ERP and makes a sort of reasonable set of plots.

To compile `webppl.min.js` to include these functions:

```sh
cd webppl
# need to make sure webppl-viz package is reachable from webppl
browserify -t [./src/bundle.js --require webppl-viz] -g brfs src/browser.js > compiled/webppl.js
uglifyjs webppl.js > webppl.min.js # to be safe, might want to specify -b ascii_only=true,beautify=false
```

See [index.html](http://web.stanford.edu/~erindb/webppl-viz/) for examples.
