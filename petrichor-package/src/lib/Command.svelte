<script>
  import SvelteMarkdown from "svelte-markdown";
  //   import s from "../assets/commands.md?raw";
  import { onMount } from "svelte";

  let source = "";
  onMount(async () => {
    const res = await fetch("/templates/commands.md");
    source = await res.text();
  });

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
</script>

<div class="markdown-body">
  <SvelteMarkdown {source} />
</div>
