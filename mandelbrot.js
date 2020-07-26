const BYTES_PER_PIXEL = 4;  // RGBA

const BASE_SCALE = 256;  // Image is pre-scaled to this value
const BAILOUT = 256;  // Distance after which the point is considered to have escaped

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

        let pixel = new Uint8ClampedArray(BYTES_PER_PIXEL);
        let n = escape([xadj, yadj], scale);
        let p = pixelColor(n);
        for (let k = 0; k < BYTES_PER_PIXEL; k++) {
            pixel[k] += p[k];
        }

        data.set(pixel, i);
    }

    return new ImageData(data, width, height);
}


/**
 * Calculate the number of iterations required to escape.
 * @param {[number, number]} c Position [x, y] (complex number).
 * @param {number} maxIterations Maximum iterations to attempt.
 * @returns {number} Smoothed number of iterations required to escape or `Infinity`.
 */
function escape(c, maxIterations) {
    let z = [0, 0];
    for (let n = 0; n < maxIterations; n++) {
        z = f(z, c);

        const dist = Math.sqrt(Math.pow(z[0], 2) + Math.pow(z[1], 2));
        if (dist > BAILOUT) {
            // Smoothing function
            return n - Math.log( Math.log(dist) / Math.log(BAILOUT)) / Math.log(2);
        }
    }

    return Infinity;
}

/**
 * Mandelbrot relation.
 *
 * f(z) = z² + c
 */
function f(z, c) {
    // let: z = Re(a) + Im(b)
    // (a + b𝑖)² = a² - b² + 2ab𝑖
    return [
        z[0] * z[0] - z[1] * z[1] + c[0],  // Real
        2 * z[0] * z[1] + c[1]  // Imaginary
    ]
}

/**
 * Calculate color of pixel based on number of iterations to escape.
 *
 * @param {number} n Number of iterations.
 */
function pixelColor(n) {
    const data = new Uint8ClampedArray(4);

    if (n === Infinity) {
        // White (#ffffff)
        data[0] = 0xff;  // R
        data[1] = 0xff;  // G
        data[2] = 0xff;  // B
        data[3] = 0xff;  // A
    } else {
        // Blue fire
        const intensity = 3 * (1 - Math.pow(Math.E, -n / 128));
        data[0] = (intensity - 2) * 0xff;  // R
        data[1] = (intensity - 1) * 0xff;  // G
        data[2] = intensity * 0xff;  // B
        data[3] = 0xff;  // A
    }

    return data;
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
