var gulp = require("gulp"),
    gutil = require("gulp-util"),
    browserify = require("browserify"),
    source = require('vinyl-source-stream'),
    uglify = require("gulp-uglify"),
    streamify = require("gulp-streamify"),
    rename = require("gulp-rename"),
    react = require("gulp-react"),
    to5ify = require('babelify'),
    jasmine = require("gulp-jasmine");
    derequire = require('gulp-derequire');

gulp.task("scripts", function() {
  browserify({entries: "./src/cortex.js", standalone: 'cortex'})
    .transform(to5ify, { optional: ["spec.protoToAssign"] })
    .bundle()
    .on("error", gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source("cortex.js"))
    .pipe(derequire())
    .pipe(gulp.dest("./build"))
    .pipe(streamify(uglify()))
    .pipe(rename("cortex.min.js"))
    .pipe(gulp.dest("build"));
});

gulp.task("test", function() {
  var tests = [
    "test/pubsub_test.js",
    "test/cortex_test.js",
    "test/immutable_wrapper_test.js",
    "test/wrappers/object_wrapper_test.js",
    "test/wrappers/array_wrapper_test.js"
  ];

  for(var i=0,ii=tests.length;i<ii;i++) {
    browserify("./" + tests[i])
      .transform(to5ify)
      .bundle()
      .on("error", gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source(tests[i]))
      .pipe(gulp.dest("temp")) // output to temp b/c node does not recognize es6 feature,
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
