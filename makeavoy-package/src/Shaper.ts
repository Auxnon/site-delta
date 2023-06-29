// const imHome = require("./assets/home.png");
/** Build an svg icon out of a pixelated image and attach to target element */
export default function attachIcon(target: HTMLElement, imageSrc: string) {
  const img = new Image();
  img.addEventListener("load", () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    if (target) {
      walker(ctx, img.width, img.height, target);
    }
    img.removeEventListener("load", this as any);
  });
  img.src = imageSrc;
}

const lookup = [
  () => "", //0
  (x, y) => `M${x} ${y + 0.5}L${x + 0.5} ${y + 1}L${x} ${y + 1}Z`, //1
  (x, y) => `M${x + 0.5} ${y + 1}L${x + 1} ${y + 0.5}L${x + 1} ${y + 1}Z`, //2
  (x, y) =>
    `M${x} ${y + 0.5}L${x + 1} ${y + 0.5}L${x + 1} ${y + 1}L${x} ${y + 1}Z`, //3
  (x, y) => `M${x + 0.5} ${y}L${x + 1} ${y + 0.5}L${x + 1} ${y}Z`, //4
  (x, y) =>
    `M${x} ${y + 0.5}L${x + 0.5} ${y}L${x + 1} ${y}L${x + 1} ${y + 0.5}L${
      x + 0.5
    } ${y + 1}L${x} ${y + 1}Z`, //5
  (x, y) =>
    `M${x + 0.5} ${y}L${x + 1} ${y}L${x + 1} ${y + 1}L${x + 0.5} ${y + 1}Z`, //6
  (x, y) => `M${x} ${y + 0.5}L${x + 0.5} ${y}H${x + 1}V${y + 1}H${x}Z`, //7
  (x, y) => `M${x} ${y}H${x + 0.5}L${x} ${y + 0.5}Z`, //8
  (x, y) => `M${x} ${y}H${x + 0.5}V${y + 1}H${x}Z`, //9
  (x, y) =>
    `M${x} ${y}H${x + 0.5}L${x + 1} ${y + 0.5}V${y + 1}H${x + 0.5}L${x} ${
      y + 0.5
    }Z`, //10
  (x, y) => `M${x} ${y}H${x + 0.5}L${x + 1} ${y + 0.5}V${y + 1}H${x}Z`, //11
  (x, y) => `M${x} ${y}H${x + 1}V${y + 0.5}H${x}Z`, //12
  (x, y) => `M${x} ${y}H${x + 1}V${y + 0.5}L${x + 0.5} ${y + 1}H${x}Z`, //13
  (x, y) => `M${x} ${y}H${x + 1}V${y + 1}H${x + 0.5}L${x} ${y + 0.5}Z`, //14
  (x, y) => `M${x} ${y}H${x + 1}V${y + 1}H${x}Z`, //15
];

function walker(
  img: CanvasRenderingContext2D,
  width: number,
  height: number,
  target: HTMLElement
) {
  let checked = Array(width);
  let bools = Array(width);
  let score = Array(width - 1);

  let d = "";
  for (let j = 0; j < height; j++) {
    checked[j] = [];
    bools[j] = [];
    if (j > 0) {
      score[j - 1] = [];
    }

    for (let i = 0; i < width; i++) {
      const p = img.getImageData(i, j, 1, 1).data;
      let bool = p[3] > 100;
      bools[j][i] = bool;
      if (i > 0 && j > 0 && i < width - 1 && j < height - 1) {
        let tl = bools[j - 1][i - 1];
        let tr = bools[j - 1][i];
        let bl = bools[j][i - 1];
        let br = bool;
        let s = (tl ? 8 : 0) + (tr ? 4 : 0) + (br ? 2 : 0) + (bl ? 1 : 0);
        score[j - 1][i - 1] = s;
        d += lookup[s](i, j) + " ";
      }
      checked[j][i] = true;
    }
  }

  const stroke = "none"; //rgb(150,000,250)";
  const fill = "white";
  const background = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 0 16 16" width="48" ><path stroke-width=".5" stroke="${stroke}" fill="${fill}" d="${d}"/></svg>')`;

  const icon = target.querySelector(".app-icon");
  if (icon) {
    (icon as HTMLElement).style.backgroundImage = background;
  }
}
