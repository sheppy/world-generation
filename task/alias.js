import gulp from "gulp";

gulp.task("build", ["html", "js", "copy-simplex"]);

gulp.task("dev", ["html", "copy-simplex", "server"]);

gulp.task("default", ["build"]);
