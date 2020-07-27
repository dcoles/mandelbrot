const BYTES_PER_PIXEL = 4;  // RGBA

const BASE_SCALE = 256;  // Image is pre-scaled to this value
const BAILOUT = 65536;  // Distance² after which the point is considered to have escaped

/**
 * Draw Mandelbrot onto Canvas.
 *
 * @param {number} width Width of the drawing.
 * @param {number} height Height of the drawing.
 * @param {object} options Custom options.
 * @return {ImageData} Rendered image.
 */
function drawMandelbrot(width, height, options) {
    const xoff = -(options.offsetX || 0);
    const yoff = -(options.offsetY || 0);
    const scale = BASE_SCALE * (options.scale || 1);

    let data = new Uint8ClampedArray(width * height * BYTES_PER_PIXEL);
    for (let i = 0; i < data.length; i += BYTES_PER_PIXEL) {
        const x = Math.floor(i / BYTES_PER_PIXEL) % width;
        const y = Math.floor(i / (width * BYTES_PER_PIXEL));

        // Adjusted for screen space
        const xadj = (x + xoff) / scale;
        const yadj = (y + yoff) / scale;

        let n = escape(xadj, yadj, scale);
        setPixelColor(data, n, i);
    }

    return new ImageData(data, width, height);
}

/**
 * Calculate the number of iterations required to escape.
 * @param {number} x X position.
 * @param {number} y X position.
 * @param {number} maxIterations Maximum iterations to attempt.
 * @returns {number} Smoothed number of iterations required to escape or `Infinity`.
 */
function escape(x, y, maxIterations) {
    let zRe = 0;
    let zIm = 0;
    for (let n = 0; n < maxIterations; n++) {
        // f(z) = z² + c
        // let: z = a + b𝑖
        // (a + b𝑖)² + c = a² - b² + 2ab𝑖 + c
        const zRe1 = zRe * zRe - zIm * zIm + x;  // Real
        const zIm1 = 2 * zRe * zIm + y;  // Imaginary

        const dist2 = Math.pow(zIm1, 2) + Math.pow(zRe1, 2);
        if (dist2 > BAILOUT) {
            // Smoothing function
            const dist = Math.sqrt(dist2);
            return n - Math.log( Math.log(dist) / Math.log(BAILOUT)) / Math.log(2);
        }

        zRe = zRe1;
        zIm = zIm1;
    }

    return Infinity;
}

/**
 * Calculate color of pixel based on number of iterations to escape.
 *
 * @param {Uint8ClampedArray} data Output buffer.
 * @param {number} n Number of iterations.
 * @param {number} offset Offset in output buffer.
 */
function setPixelColor(data, n, offset) {
    if (n === Infinity) {
        // White (#ffffff)
        data[offset] = 0xff;  // R
        data[offset + 1] = 0xff;  // G
        data[offset + 2] = 0xff;  // B
        data[offset + 3] = 0xff;  // A
    } else {
        // Blue fire
        const intensity = 3 * (1 - Math.pow(Math.E, -n / 128));
        data[offset] = (intensity - 2) * 0xff;  // R
        data[offset + 1] = (intensity - 1) * 0xff;  // G
        data[offset + 2] = intensity * 0xff;  // B
        data[offset + 3] = 0xff;  // A
    }
}

/**
 * WebWorker hook to render a new Mandelbrot fractal.
 *
 * Expected message: `[width, height]`
 *
 * @param e WebWorker message.
 */
onmessage = function(e) {
    const width = e.data[0];
    const height = e.data[1];
    const options = e.data[2];

    const data = drawMandelbrot(width, height, options);

    // Pass buffer back to page
    postMessage(data);
}
