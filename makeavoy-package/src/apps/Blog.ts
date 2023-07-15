import AppEnvironment from "../types/AppEnvironment";
import { marked } from "marked";
// document.getElementById('content').innerHTML =
// marked.parse('# Marked in the browser\n\nRendered by **marked**.');

export default class Blog extends AppEnvironment {
  constructor(private dom: HTMLElement, id: number) {
    super(dom, id);
    let holder = document.createElement("div");
    holder.id = "blog-holder";
    holder.innerHTML = marked.parse(
      "# Marked in the browser\n\nRendered by **marked**."
    );
    this.dom.appendChild(holder);
  }
}
