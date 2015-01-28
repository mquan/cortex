var gulp = require("gulp"),
    gutil = require("gulp-util"),
    browserify = require("browserify"),
    source = require('vinyl-source-stream'),
    uglify = require("gulp-uglify"),
    streamify = require("gulp-streamify"),
    rename = require("gulp-rename"),
    react = require("gulp-react"),
    jasmine = require("gulp-jasmine");

gulp.task("scripts", function() {
  browserify("./src/cortex.js")
    .bundle()
    .on("error", gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source("cortex.js"))
    .pipe(gulp.dest("./build"))
    .pipe(streamify(uglify()))
    .pipe(rename({ext: ".min.js"}))
    .pipe(gulp.dest("build"));
});

gulp.task("test", function() {
  var tests = [
    "test/pubsub_test.js",
    "test/data_wrapper_test.js",
    "test/data_wrapper_test.js",
    "test/wrappers/array_test.js",
    "test/wrappers/hash_test.js",
    "test/cortex_test.js"
  ];

  for(var i=0,ii=tests.length;i<ii;i++) {
    browserify("./" + tests[i])
      .bundle()
      .on("error", gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source(tests[i]))
      .pipe(streamify(jasmine()));
  }
});

gulp.task("react", ["scripts"], function() {
  var examples = [
    "file_system",
    "skyline"
  ];

  for(var i=0, ii=examples.length;i<ii;i++) {
    gulp.src(["examples/" + examples[i] + "/application.jsx"])
      .pipe(react())
      .pipe(gulp.dest("examples/" + examples[i]));
  }
});

gulp.task("default", ["scripts"], function() {
  gulp.watch("src/**", ["scripts"]);
});
