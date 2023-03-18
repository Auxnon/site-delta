<script lang="ts">
  // import { Editor, Viewer } from "bytemd";
  // import gfm from "@bytemd/plugin-gfm";
  // import Counter from "./lib/Counter.svelte";
  import "github-markdown-css/github-markdown.css";
  import Command from "./lib/Command.svelte";
  import Header from "./lib/Header.svelte";

  let main_color = "white";
  let value;
  const text = `
  # Hello World
<p style="red">test</p>
  `;
  // const plugins = [
  //   gfm(),
  //   // Add more plugins here
  // ];

  // function handleChange(e) {
  //   value = e.detail.value;
  // }
</script>

<Header />
<main style="--color-main: {main_color}">
  <!-- <div class="card">
    <Counter />
  </div> -->

  <!-- <Editor {value} {plugins} on:change={handleChange} /> -->
  <Command />
</main>
