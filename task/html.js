import path from "path";
import gulp from "gulp";
import config from "./config";

// Copy HTML
gulp.task("html", () => {
    return gulp
        .src(path.join(config.dir.src, "index.html"))
        .pipe(gulp.dest(config.dir.dist));
});
