/**
 * Draw Mandelbrot onto Canvas.
 *
 * @param {number} width Width of the drawing.
 * @param {number} height Height of the drawing.
 */
function drawMandelbrot(width, height) {
    const bpp = 4; // bytes-per-pixel
    const xoff = -2 * width / 3;
    const yoff = -height / 2;
    const scale = 0.4;
    const maxIterations = 1000;
    const target = 20;  // Steps of target colour
    const steps = 25;  // Steps out from target to black

    const growth = Math.pow(255, 1 / steps);

    let data = new Uint8ClampedArray(width * height * bpp);
    for (let i = 0; i < data.length; i += bpp) {
        const x = Math.floor(i / bpp) % width;
        const y = Math.floor(i / (width * bpp));

        // Adjusted for screen space
        const xadj = (x + xoff) / height / scale;
        const yadj = (y + yoff) / height / scale;
        const c = [xadj, yadj];

        let n = escape(c, maxIterations);
        if (n === Infinity) {
            // White (#ffffff)
            data[i] = 0xff;  // R
            data[i + 1] = 0xff;  // G
            data[i + 2] = 0xff;  // B
            data[i + 3] = 0xff;  // A
        /* For debugging
        } else if (n === target) {
            // Red (#ff0000)
            data[i] = 0xff;  // R
            data[i + 1] = 0x00;  // G
            data[i + 2] = 0x00;  // B
            data[i + 3] = 0xff;  //
        */
        } else {
            // Blue fire
            const intensity = Math.pow(growth, n - target);
            data[i]   = (intensity - 2) * 0xff;  // R
            data[i+1] = (intensity - 1) * 0xff;  // G
            data[i+2] = intensity * 0xff;  // B
            data[i+3] = 0xff;  // A
        }
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
    const bailout = 256;
    let z = [0, 0];
    for (let n = 0; n < maxIterations; n++) {
        z = f(z, c);

        const dist = Math.sqrt(Math.pow(z[0], 2) + Math.pow(z[1], 2));
        if (dist > bailout) {
            // Smoothing function
            return n - Math.log( Math.log(dist) / Math.log(bailout)) / Math.log(2);
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
