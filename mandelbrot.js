const BYTES_PER_PIXEL = 4;  // RGBA

const SCALE = 0.4;  // Scale of the image
const BAILOUT = 256;  // Distance after which the point is considered to have escaped
const MAX_ITERATIONS = 1000;  // Maximum iterations to test for escape
const TARGET = 20;  // Steps of TARGET colour
const STEPS = 25;  // Steps out from TARGET to black

const GROWTH = Math.pow(255, 1 / STEPS);

/**
 * Draw Mandelbrot onto Canvas.
 *
 * @param {number} width Width of the drawing.
 * @param {number} height Height of the drawing.
 */
function drawMandelbrot(width, height) {
    const xoff = -2 * width / 3;
    const yoff = -height / 2;

    let data = new Uint8ClampedArray(width * height * BYTES_PER_PIXEL);
    for (let i = 0; i < data.length; i += BYTES_PER_PIXEL) {
        const x = Math.floor(i / BYTES_PER_PIXEL) % width;
        const y = Math.floor(i / (width * BYTES_PER_PIXEL));

        // Adjusted for screen space
        const xadj = (x + xoff) / height / SCALE;
        const yadj = (y + yoff) / height / SCALE;
        const c = [xadj, yadj];

        let n = escape(c, MAX_ITERATIONS);
        let pixel = pixelColor(n);
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
/* For debugging
    } else if (n === TARGET) {
        // Red (#ff0000)
        data[0] = 0xff;  // R
        data[1] = 0x00;  // G
        data[2] = 0x00;  // B
        data[3] = 0xff;  // A
*/
    } else {
        // Blue fire
        const intensity = Math.pow(GROWTH, n - TARGET);
        data[0]   = (intensity - 2) * 0xff;  // R
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
    const size = e.data;
    console.log('onmessage: ' + size);

    const data = drawMandelbrot(size[0], size[1]);
    console.log('Done');

    // Pass buffer back to page
    postMessage(data);
}
