export function init() {
  const pal = `JASC-PAL
0100
12
0 0 0
0 40 65
43 123 116
102 165 115
0 239 74
236 154 109
194 75 110
147 47 123
255 255 255
121 165 189
119 217 207
149 240 167
`;

  function convertPal(pal) {
    let lines = pal.split("\n");
    let colors: string[] = [];
    let i = 0;
    lines.forEach((line: string) => {
      let rgb = line.split(" ");
      if (rgb.length <= 1) return;
      // to hex
      rgb = rgb.map((c) => {
        let hex = parseInt(c).toString(16);
        if (hex.length == 1) hex = "0" + hex;
        return hex;
      });
      const c = rgb.join("");
      console.log("%c" + c, "background: #" + c);
      colors.push(c);

      // colors.push({
      //     r: parseInt(rgb[0]),
      //     g: parseInt(rgb[1]),
      //     b: parseInt(rgb[2]),
      // });
    });
    // console.log(colors);
    return colors;
  }

  convertPal(pal);
}
