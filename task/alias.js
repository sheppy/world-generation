import gulp from "gulp";

gulp.task("build", ["html", "js"]);

gulp.task("dev", ["html", "server"]);

gulp.task("default", ["build"]);
