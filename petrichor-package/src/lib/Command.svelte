<script lang="ts">
  import SvelteMarkdown from "svelte-markdown";
  import hljs from "highlight.js";
  //   import s from "../assets/commands.md?raw";
  import { afterUpdate, onMount } from "svelte";
  import HighlightedCode from "./HighlightedCode.svelte";
  import SearchBar from "./SearchBar.svelte";

  let source = "";
  export let setFilter;
  const renderers = {
    code: HighlightedCode,
  };
  onMount(async () => {
    const res = await fetch("/templates/guide.md");
    source = await res.text();
    // @ts-ignore
    window.hljs = hljs;
  });

  afterUpdate(() => {
    makeSections();
  });

  function makeSections() {
    const body = document.querySelector(".markdown-body");
    // console.log("len", len);
    let currentDetail;
    let filters = [];
    if (body.children.length > 0) {
      for (let i = 0; i < body.children.length; i++) {
        const e = body.children[i];
        // console.log(e.tagName);

        if (e.tagName === "H2") {
          currentDetail = document.createElement("details");
          filters.push({ label: (e as HTMLElement).innerText });
          // wrap in summary
          const summary = document.createElement("summary");
          summary.appendChild(e.cloneNode(true));
          body.replaceChild(currentDetail, e);
          // e.remove();
          currentDetail.appendChild(summary);
        } else if (e.tagName === "HR") {
          currentDetail.appendChild(e.cloneNode(true));
          e.remove();
          currentDetail = undefined;
          i--;
        } else if (currentDetail) {
          currentDetail.appendChild(e.cloneNode(true));
          e.remove();
          i--;
        }
      }
    }
    if (setFilter) {
      setFilter(filters);
    }
  }
  //   const source = `
  // # This is a header

  // This is a paragraph.

  // * This is a list
  // * With two items
  // 1. And a sublist
  // 2. That is ordered
  // * With another
  // * Sublist inside

  // | And this is | A table |
  // |-------------|---------|
  // | With two | columns |`;
  function handleParsed(event) {
    //access tokens via event.detail.tokens
    console.log(event);

    // document.querySelectorAll("pre code").forEach((block) => {
    //   console.log("block", block.innerHTML);
    //   hljs.highlightBlock(block as HTMLElement);
    // });
    // hljs.highlightAll();
    // event.detail.tokens.forEach((token) => {
    //   if (token.type === "code") {
    //     const res = hljs.highlight("lua", token.text);
    //     if (!res.illegal) {
    //       token.text = res.value;
    //     }
    //     // token.text = token.text
    //     //   .split("\n")
    //     //   .map((line) => "GG" + line)
    //     //   .join("\n");
    //   }
    // });
  }
</script>

<div class="markdown-body">
  <SvelteMarkdown {source} {renderers} on:parsed={handleParsed} />
</div>
