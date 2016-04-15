class Util {
    static indexToXY(i, width) {
        let x = Math.floor(i / width);
        let y = i % width;
        return [x, y];
    }

    static xYToIndex(x, y, width) {
        return width * y + x;
    }

    static pointsToRect(points, width, height) {
        let rect = {
            top: height,
            bottom: 0,
            left: width,
            right: 0
        };

        for (let i = 0, j = points.length; i < j; i++) {
            if (points[i][0] > rect.right) { rect.right = points[i][0]; }
            if (points[i][0] < rect.left) { rect.left = points[i][0]; }
            if (points[i][1] > rect.bottom) { rect.bottom = points[i][1]; }
            if (points[i][1] < rect.top) { rect.top = points[i][1]; }
        }

        return rect;
    }

    static getCenterOfRect(rect) {
        return [
            Math.floor((rect.right - rect.left) / 2) + rect.left,
            Math.floor((rect.bottom - rect.top) / 2) + rect.top
        ];
    }
}

module.exports = Util;
