<script lang="ts">
  import { onMount } from "svelte";
  import { get_current_component } from "svelte/internal";

  let comp;
  let data;
  export let className = "picon down-icon";
  let text;
  let tag;
  $: className = `picon ${data?.innerText}-icon`;
  $: console.log("hiya", data?.innerHTML, tag);
  const forwardEvents = funcy(get_current_component());
  function funcy(ev) {
    // debugger;
  }
  export let use: any = [];
</script>

<svelte:component
  this={comp}
  {tag}
  use={[forwardEvents, ...use]}
  class={`${data?.innerText}-icon`}
/>

<div class={className} bind:this={data}>
  <slot />
</div>

<style>
  .picon {
    align-items: center;
    display: inline-flex;
    justify-content: center;
    display: block;
    width: 24px;
    height: 24px;
    background-repeat: no-repeat;
    background-size: cover;
    object-fit: stretch;
    image-rendering: pixelated;
    color: transparent;
    outline: none;
    cursor: pointer;
  }
  .search-icon {
    background-image: url("./search.png");
  }
  .down-icon {
    background-image: url("./down.png");
  }
  .up-icon {
    background-image: url("./up.png");
  }
  .download-icon {
    background-image: url("./download.png");
  }
</style>
