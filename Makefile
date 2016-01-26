demo/webppl-viz.js : src/index.js
	@browserify "$<" > "$@"

watch :
	watchify src/index.js -o demo/webppl-viz.js