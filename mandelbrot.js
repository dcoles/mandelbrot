/**
 * Draw Mandelbrot onto Canvas.
 *
 * @param canvas: HTML `canvas` to draw onto.
 */
function drawMandelbrot(canvas) {
    const ctx = canvas.getContext('2d');
    let img = ctx.createImageData(canvas.width, canvas.height);

    const xoff = -2 * img.width / 3;
    const yoff = -img.height / 2;
    const scale = 0.4;
    const maxIterations = 1000;
    const target = 20;  // Steps of target colour
    const steps = 25;  // Steps out from target to black

    const growth = Math.pow(255, 1 / steps);

    for (let i=0; i<img.data.length; i+=4) {
        const x = Math.floor(i / 4) % img.width;
        const y = Math.floor(i / (img.width * 4));

        // Adjusted for screen space
        const xadj = (x + xoff) / img.height / scale;
        const yadj = (y + yoff) / img.height / scale;
        const c = [xadj, yadj];

        let n = escape(c, maxIterations);
        if (n === Infinity) {
            // White (#ffffff)
            img.data[i] = 0xff;  // R
            img.data[i + 1] = 0xff;  // G
            img.data[i + 2] = 0xff;  // B
            img.data[i + 3] = 0xff;  // A
            /*
                    // For debugging
                    } else if (n === target) {
                        // Red (#ff0000)
                        img.data[i] = 0xff;  // R
                        img.data[i + 1] = 0x00;  // G
                        img.data[i + 2] = 0x00;  // B
                        img.data[i + 3] = 0xff;  //
             */
        } else {
            // Blue fire
            const intensity = Math.pow(growth, n - target);
            img.data[i]   = (intensity - 2) * 0xff;  // R
            img.data[i+1] = (intensity - 1) * 0xff;  // G
            img.data[i+2] = intensity * 0xff;  // B
            img.data[i+3] = 0xff;  // A
        }
    }

    ctx.putImageData(img, 0, 0);
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
