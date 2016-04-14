class FloodFill {
    static fill(map, width, height, x, y, newColor, oldColor) {
        let filledPixels = [];
        let stack = [];
        let mapLength = width * height;
        let ret = this.fillPixel(map, width, mapLength, stack, x, y, newColor, oldColor);
        if (!ret) {
            console.warn("no filled pixels", x, y, newColor, oldColor);
            return filledPixels;
        }

        filledPixels.push([x, y]);

        while (stack.length) {
            let toFill = stack.pop();
            ret = this.fillPixel(map, width, mapLength, stack, toFill[0], toFill[1], newColor, oldColor);

            if (ret) {
                filledPixels.push(toFill);
            }
        }

        return filledPixels;
    }

    static fillPixel(map, width, mapLength, stack, x, y, newColor, oldColor) {
        let i = width * y + x;
        let i1 = (width * y) + x + 1;
        let i2 = (width * (y + 1)) + x;
        let i3 = (width * y) + x - 1;
        let i4 = (width * (y - 1)) + x;

        if (map[i] !== oldColor) {
            return false;
        }

        map[i] = newColor;

        if (i1 < mapLength && map[i1] === oldColor) stack.push([x + 1, y]);
        if (i2 < mapLength && map[i2] === oldColor) stack.push([x, y + 1]);
        if (i3 > 0 && map[i3] === oldColor) stack.push([x - 1, y]);
        if (i4 > 0 && map[i4] === oldColor) stack.push([x, y - 1]);

        return true;
    }

    static fillRegion(map, width, height, region, newColor) {
        for (let r = 0; r < region.length; r++) {
            let x = region[r][0];
            let y = region[r][1];
            let i = width * y + x;

            map[i] = newColor;
        }
    }

    /*
    floodFillScanlineStack(map, x, y, newColor, oldColor) {
        if (oldColor === newColor) {
            return;
        }

        let stack = [];
        let i = this.width * y + x;
        stack.push(i);

        let x1, spanAbove, spanBelow;

        while (stack.length) {
            // Get next value from stack
            i = stack.pop();

            x = Math.floor(i / this.width);
            y = i % this.width;

            x1 = x;
            while (x1 >= 0 && map[this.width * y + x1] === oldColor) {
                x1--
            }
            x1++;
            spanAbove = spanBelow = 0;
            while (x1 < this.width && map[this.width * y + x1] === oldColor) {
                // console.log(x1, y, newColor);
                map[this.width * y + x1] = newColor;

                if (!spanAbove && y > 0 && map[(this.width * (y - 1)) + x1] === oldColor) {
                    // if (!push(x1, y - 1)) return;
                    stack.push((this.width * (y - 1)) + x1);
                    break;
                    // spanAbove = 1;
                }
                else if (spanAbove && y > 0 && map[(this.width * (y - 1)) + x1] !== oldColor) {
                    spanAbove = 0;
                }

                if (!spanBelow && y < this.height - 1 && map[(this.width * (y + 1)) + x1] === oldColor) {
                    // if (!push(x1, y + 1)) return;
                    stack.push((this.width * (y + 1)) + x1);
                    break;
                    // return;
                    // spanBelow = 1;
                }
                else if (spanBelow && y < this.height - 1 && map[(this.width * (y + 1)) + x1] !== oldColor) {
                    spanBelow = 0;
                }

                x1++;
            }
        }

    }
    */
}

module.exports = FloodFill;
