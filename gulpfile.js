var gulp = require("gulp"),
    gutil = require("gulp-util"),
    browserify = require("gulp-browserify"),
    coffee = require("gulp-coffee"),
    uglify = require("gulp-uglify"),
    rename = require("gulp-rename"),
    react = require("gulp-react"),
    jasmine = require("gulp-jasmine");

gulp.task("coffee", function() {
  //Must first convert coffee to js since gulp-browserify expects only .js files
  //https://github.com/deepak1556/gulp-browserify/issues/7
  gulp.src(["src/*.coffee", "src/**/*.coffee"])
      .pipe(coffee({bare: true}).on("error", gutil.log))
      .pipe(gulp.dest("temp/src"));

  gulp.src(["test/*.coffee", "test/**/*.coffee"])
      .pipe(coffee({bare: true}).on("error", gutil.log))
      .pipe(gulp.dest("temp/test"));
});

gulp.task("scripts", function() {
  gulp.run("coffee");

  gulp.src(["temp/src/cortex.js"])
      .pipe(browserify())
      .pipe(gulp.dest("build"));

  gulp.src(["build/cortex.js"])
      .pipe(uglify())
      .pipe(rename({ext: ".min.js"}))
      .pipe(gulp.dest("build"));
});

gulp.task("test", function() {
  gulp.run("coffee");

  var tests = [
    "temp/test/path_test.js",
    "temp/test/data_wrapper_test.js",
    "temp/test/wrappers/enumerable_test.js",
    "temp/test/cortex_test.js"
  ];

  for(var i=0,ii=tests.length;i<ii;i++) {
    gulp.src([tests[i]])
        .pipe(browserify())
        .pipe(jasmine());
  }
});

gulp.task("react", function() {
  gulp.src(["examples/skyline/application.jsx"])
      .pipe(react())
      .pipe(gulp.dest("examples/skyline"));
});

gulp.task("default", function() {
  gulp.run("scripts");

  gulp.watch("src/**", function(event) {
    gulp.run("scripts");
  });
});
