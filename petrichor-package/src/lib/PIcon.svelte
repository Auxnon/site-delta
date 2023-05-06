<script lang="ts">
  let comp;
  let data;
  export let className = "picon down-icon";
  let text;
  let tag;
  $: className = `picon ${data?.innerText}-icon`;
  // $: console.log("hiya", data?.innerHTML, tag);
  export let use: any = [];
</script>

<svelte:component this={comp} {tag} class={`${data?.innerText}-icon`} />

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

  :global(.mdc-fab) .picon {
    filter: invert(1);
  }
  @media (prefers-color-scheme: light) {
    .picon {
      filter: invert(1);
    }
    :global(.mdc-fab) .picon {
      filter: none;
    }
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
