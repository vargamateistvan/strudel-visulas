import "@testing-library/jest-dom/vitest";

if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  (globalThis as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
    ResizeObserverMock;
}

if (!("ImageData" in globalThis)) {
  class ImageDataMock {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(Math.max(4, width * height * 4));
    }
  }

  (globalThis as { ImageData: typeof ImageDataMock }).ImageData = ImageDataMock;
}

HTMLCanvasElement.prototype.getContext = (() => ({
  setTransform: () => undefined,
  fillRect: () => undefined,
  clearRect: () => undefined,
  beginPath: () => undefined,
  moveTo: () => undefined,
  lineTo: () => undefined,
  stroke: () => undefined,
  arc: () => undefined,
  fill: () => undefined,
  closePath: () => undefined,
  save: () => undefined,
  restore: () => undefined,
  scale: () => undefined,
  translate: () => undefined,
  rotate: () => undefined,
  strokeRect: () => undefined,
  fillText: () => undefined,
  putImageData: () => undefined,
  getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
  createImageData: (w = 1, h = 1) => ({
    data: new Uint8ClampedArray(Math.max(4, w * h * 4)),
    width: w,
    height: h,
  }),
  drawImage: () => undefined,
  createLinearGradient: () => ({ addColorStop: () => undefined }),
  createRadialGradient: () => ({ addColorStop: () => undefined }),
})) as typeof HTMLCanvasElement.prototype.getContext;
