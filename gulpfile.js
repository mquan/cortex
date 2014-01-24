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


gulp.task("default", function() {
  gulp.run("scripts");

  gulp.watch("src/**", function(event) {
    gulp.run("scripts");
  });
});
