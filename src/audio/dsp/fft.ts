export const isPowerOfTwo = (value: number): boolean =>
  Number.isInteger(value) && value > 0 && (value & (value - 1)) === 0;

/**
 * In-place iterative radix-2 Cooley–Tukey FFT.
 * `real` and `imag` must have the same power-of-two length.
 */
export const fft = (real: Float64Array, imag: Float64Array): void => {
  const size = real.length;

  if (!isPowerOfTwo(size) || imag.length !== size) {
    throw new Error(`FFT size must be a power of two, received ${size}.`);
  }

  for (let index = 1, reversed = 0; index < size; index += 1) {
    let bit = size >> 1;

    while (reversed & bit) {
      reversed ^= bit;
      bit >>= 1;
    }

    reversed ^= bit;

    if (index < reversed) {
      [real[index], real[reversed]] = [real[reversed], real[index]];
      [imag[index], imag[reversed]] = [imag[reversed], imag[index]];
    }
  }

  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    const stepReal = Math.cos(angle);
    const stepImag = Math.sin(angle);
    const half = length >> 1;

    for (let start = 0; start < size; start += length) {
      let twiddleReal = 1;
      let twiddleImag = 0;

      for (let offset = 0; offset < half; offset += 1) {
        const evenIndex = start + offset;
        const oddIndex = evenIndex + half;
        const oddReal =
          real[oddIndex] * twiddleReal - imag[oddIndex] * twiddleImag;
        const oddImag =
          real[oddIndex] * twiddleImag + imag[oddIndex] * twiddleReal;

        real[oddIndex] = real[evenIndex] - oddReal;
        imag[oddIndex] = imag[evenIndex] - oddImag;
        real[evenIndex] += oddReal;
        imag[evenIndex] += oddImag;

        const nextTwiddleReal = twiddleReal * stepReal - twiddleImag * stepImag;
        twiddleImag = twiddleReal * stepImag + twiddleImag * stepReal;
        twiddleReal = nextTwiddleReal;
      }
    }
  }
};

export const createHannWindow = (size: number): Float64Array => {
  const window = new Float64Array(size);

  for (let index = 0; index < size; index += 1) {
    window[index] = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1));
  }

  return window;
};
