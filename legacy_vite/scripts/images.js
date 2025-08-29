// Use URL constructor for assets
const swancomputerImg = new URL('/images/swancomputer.jpeg', import.meta.url).href;
const leftDrawingImg = new URL('/images/left-drawing.jpeg', import.meta.url).href;
const rightDrawingImg = new URL('/images/right-drawing.jpeg', import.meta.url).href;

export const images = {
  swancomputer: swancomputerImg,
  leftDrawing: leftDrawingImg,
  rightDrawing: rightDrawingImg
}; 