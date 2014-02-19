var gulp = require("gulp"),
    gutil = require("gulp-util"),
    browserify = require("gulp-browserify"),
    uglify = require("gulp-uglify"),
    rename = require("gulp-rename"),
    react = require("gulp-react"),
    jasmine = require("gulp-jasmine");

gulp.task("scripts", function() {
  gulp.src("src/cortex.js")
      .pipe(browserify())
      .pipe(gulp.dest("build"));

  gulp.src("build/cortex.js")
      .pipe(uglify())
      .pipe(rename({ext: ".min.js"}))
      .pipe(gulp.dest("build"));
});

gulp.task("test", function() {
  var tests = [
    "test/pubsub_test.js",
    "test/data_wrapper_test.js",
    "test/wrappers/array_test.js",
    "test/wrappers/hash_test.js",
    "test/cortex_test.js"
  ];

  for(var i=0,ii=tests.length;i<ii;i++) {
    gulp.src([tests[i]])
        .pipe(browserify())
        .pipe(jasmine());
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

gulp.task("default", function() {
  gulp.run("scripts");

  gulp.watch("src/**", function(event) {
    gulp.run("scripts");
  });
});
