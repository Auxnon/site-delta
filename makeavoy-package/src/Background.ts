let red;
let blue;
let green;
export function initBackground() {
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  bg.id = "background";
  const body = document.querySelector("body");
  if (!body) return;
  red = document.createElementNS("http://www.w3.org/2000/svg", "path");
  blue = document.createElementNS("http://www.w3.org/2000/svg", "path");
  green = document.createElementNS("http://www.w3.org/2000/svg", "path");
  red.classList.add("path-red");
  blue.classList.add("path-blue");
  green.classList.add("path-green");
  red.setAttribute("d", "M0 0 L0 1 L99 100 L100 100 L100 99 L1 0Z");
  blue.setAttribute("d", "M0 1 L0 3 L97 100 L99 100 Z");
  green.setAttribute("d", "M1 0 L3 0 L100 97 L100 99 Z");
  bg.setAttribute("width", "100%");
  bg.setAttribute("height", "100%");
  bg.setAttribute("viewBox", "0 0 100 100");
  bg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  bg.appendChild(red);
  bg.appendChild(blue);
  bg.appendChild(green);

  body.insertBefore(bg, body.firstChild);
}
