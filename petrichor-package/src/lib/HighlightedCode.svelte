<script lang="ts">
  //   import Highlight from "svelte-highlight";
  import hljs from "highlight.js/lib/core";
  import lua from "svelte-highlight/languages/lua";
  hljs;

  //   const res = lua.register(hljs);
  //   const fn = (() => res) as any;
  // @ts-ignore
  let model = hljs.getLanguage("lua");
  if (typeof model.keywords === "object" && model.keywords.keyword) {
    model.keywords.keyword += "tile";
  } else {
    // model.keywords.push(["tile"]);
  }
  export let lang;
  export let text;
  const html = hljs.highlight("lua", text).value;
</script>

<pre><code>{@html html}</code></pre>
<!-- <Highlight language={fn} code={text} /> -->
<!-- <pre class={lang}><code>{text}</code></pre> -->
