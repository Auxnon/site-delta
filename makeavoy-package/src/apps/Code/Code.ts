// document.getElementById('content').innerHTML =
// marked.parse('# Marked in the browser\n\nRendered by **marked**.');

import AppEnvironment from "../../types/AppEnvironment";
import "./index.scss";
import init, { run } from "silt_lua";

export default class Code extends AppEnvironment {
  panel: HTMLElement;
  area: HTMLTextAreaElement;
  back: HTMLElement;
  output: HTMLElement;
  lines: number = 0;
  domLines: number = 0;
  runner?: (s: string) => string;
  throttle;
  constructor(private dom: HTMLElement, id: number) {
    super(dom, id);
    this.resolver();
    init().then(() => {
      // window.go = (s) => run(s);
      this.runner = (s) => run(s);
      // @ts-ignore
      window.jprintln = (s) => this.println(s);
      // let a = run("1+2");
      // alert(a);
    });
  }

  open(canvas?: HTMLElement): void {
    this.makePanel();
    this.addLine();
    this.addLine();
    this.addLine();
  }

  refreshCode() {
    const fontSize = 32; //parseFloat(getComputedStyle(this.area).fontSize) || 10;
    const slices = this.area.value.split("\n");
    this.lines = slices.length;
    if (this.lines > this.domLines) {
      for (let i = this.domLines; i < this.lines; i++) {
        this.addLine();
      }
    } else if (this.lines < this.domLines) {
      for (let i = this.domLines; i > this.lines; i--) {
        this.back.removeChild(this.back.lastChild as HTMLElement);
      }
      this.domLines = this.lines;
    }
    // for (let i = 0; i < this.lines; i++) {
    //   (this.back.childNodes[i] as HTMLElement).style.width =
    //     slices[i].length + "rem";
    // }
    this.area.style.height = this.lines * fontSize + "px";
  }

  makePanel() {
    const p = document.createElement("div");
    p.classList.add("code-panel");

    const seg = document.createElement("div");
    seg.classList.add("code-segment");
    p.appendChild(seg);

    const a = document.createElement("textarea");
    a.classList.add("code-area");
    a.innerText = "a";
    this.area = a;
    this.area.addEventListener("keydown", (ev: KeyboardEvent) => {
      this.keycheck(ev);
    });
    seg.appendChild(a);

    const b = document.createElement("div");
    b.classList.add("code-back");
    seg.appendChild(b);
    this.back = b;

    const out = document.createElement("div");
    out.classList.add("code-output");
    const outp = document.createElement("p");
    out.appendChild(outp);
    this.output = outp;
    p.appendChild(out);

    const extra = document.createElement("div");
    extra.classList.add("code-panel", "backpanel");

    this.panel = p;
    this.dom.appendChild(extra);
    this.dom.appendChild(this.panel);
    return p;
  }

  addLine(s: string = "") {
    const p = document.createElement("p");
    p.classList.add("code-line");
    p.innerText = s;
    this.back?.appendChild(p);
    this.domLines++;
  }

  keycheck(ev: KeyboardEvent) {
    clearTimeout(this.throttle);
    if (ev.code === "Enter") {
      if (ev.shiftKey) {
        ev.preventDefault();
        this.run();
      } else {
        setTimeout(() => {
          this.refreshCode();
        });
      }
    } else if (ev.code === "Tab") {
      ev.preventDefault();
      const start = this.area.selectionStart;
      const end = this.area.selectionEnd;
      this.area.value =
        this.area.value.substring(0, start) +
        "\t" +
        this.area.value.substring(end);
      this.area.selectionStart = this.area.selectionEnd = start + 1;
    } else {
      this.throttle = setTimeout(() => {
        this.refreshCode();
      }, 100);
    }
  }

  run() {
    const code = this.area.value;
    // this.output.innerText = "";
    if (this.runner) {
      const s = `> ${this.runner(code)}\n`;
      this.output.innerText += s;
    } else {
      this.output.innerText = "lua module failed to load";
    }
  }

  println(s: string) {
    this.output.innerText += `${s}\n`;
  }

  close(): void {
    this.dom.childNodes.forEach((n, i) => {
      if (i > 0) this.dom.removeChild(n);
    });
  }
}
