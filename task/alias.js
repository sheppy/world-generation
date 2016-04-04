import gulp from "gulp";

gulp.task("copy-deps", ["copy-simplex", "copy-dat.gui"]);

gulp.task("build", ["html", "js", "copy-deps"]);

gulp.task("dev", ["html", "copy-deps", "server"]);

gulp.task("default", ["build"]);
