<script lang="ts">
  import "github-markdown-css/github-markdown.css";
  import Command from "./lib/Command.svelte";
  import Header from "./lib/Header.svelte";
  import SearchBar from "./lib/SearchBar.svelte";
  import Fab, { Icon } from "@smui/fab";
  import IconButton from "@smui/icon-button";
  import BottomAppBar, {
    Section,
    AutoAdjust,
  } from "@smui-extra/bottom-app-bar";
  import SvelteTooltip from "svelte-tooltip";
  import PIcon from "./lib/PIcon.svelte";
  import { MetaTags } from "svelte-meta-tags";

  let main_color = "white";
  let value;
  // let searchBar: SearchBar;
  let updateFilters;
  let openInput;
  let command: Command;
  let expansionStatus = "down";
  let expanded = false;
  let bottomAppBar: BottomAppBar;

  function picked(e) {
    let details = e.detail.label
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[()]/g, "");

    const target = document.querySelector(`#${details}`).parentElement
      .parentElement;
    target.setAttribute("open", "");
    target.classList.add("shimmering");
    setTimeout(() => {
      target.classList.remove("shimmering");
    }, 2000);

    var url = location.href;
    location.href = "#" + details;
    history.replaceState(null, null, url);
  }

  function toggleExpand() {
    if (expanded) {
      expansionStatus = "down";
      expanded = false;
      document.querySelectorAll("details").forEach((e) => {
        e.removeAttribute("open");
      });
    } else {
      expansionStatus = "up";
      expanded = true;
      document.querySelectorAll("details").forEach((e) => {
        e.setAttribute("open", "");
      });
    }
  }

  const isMobile =
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i);
</script>

<svelte:head>
  <style>
    @font-face {
      font-family: "dafont";
      font-style: normal;
      font-weight: 400;
      src: url("/fonts/Perfect-DOS-VGA-437.ttf") format("truetype");
    }

    /* @import url("https://fonts.googleapis.com/css?family=Raleway&display=swap"); */
  </style>
  <link
    rel="stylesheet"
    href="https://unpkg.com/svelte-highlight/styles/github.css"
  />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/icon?family=Material+Icons"
  />
  <link rel="stylesheet" href="smui.css" />
  <!-- <link rel="stylesheet" href="node_modules/svelte-material-ui/bare.css" /> -->
</svelte:head>

<SearchBar on:pick={picked} bind:updateFilters bind:openInput />
<main>
  <div id="inner-main">
    <Header />
    <template style="--color-main: {main_color}">
      <Command bind:setFilter={updateFilters} />
    </template>
  </div>
</main>

<BottomAppBar
  variant="fixed"
  bind:this={bottomAppBar}
  class="bottom-bg"
  style="font-family: dafont;"
>
  <Section>
    <!-- <SvelteTooltip tip="Download" top> -->
    <a href="https://makeavoy.itch.io/petrichor64">
      <PIcon>download</PIcon>
    </a>
    <!-- <PIcon>download</PIcon> -->
    <!-- </SvelteTooltip> -->

    <!-- <IconButton class="material-icons" aria-label="Mark unread">mail</IconButton -->

    <!-- <IconButton class="material-icons" aria-label="Label">label</IconButton>
    <IconButton class="material-icons" aria-label="Trash">delete</IconButton> -->
  </Section>
  <Section fabInset>
    <Fab aria-label="Toggle Expand" on:click={toggleExpand}>
      <!-- <Icon class="material-icons">{expansionStatus}</Icon> -->
      <PIcon className={`picon ${expansionStatus}-icon`}>down</PIcon>
    </Fab>
  </Section>
  {#if isMobile}
    <Section fabInset>
      <Fab aria-label="Toggle Expand" on:click={openInput}>
        <PIcon>search</PIcon>
      </Fab>
    </Section>
  {/if}
</BottomAppBar>

<!-- <button class="mdc-fab" aria-label="Favorite">
  <div class="mdc-fab__ripple" />
  <span class="mdc-fab__icon material-icons">favorite</span>
</button> -->
<MetaTags
  openGraph={{
    url: "https://petrichor64.app/",
    title: "Petrichor64 Website",
    description: "The Petrichor64 game engine official site and documentation",
    images: [
      {
        url: "https://petrichor64.app/p64.png",
        width: 727,
        height: 146,
        alt: "Petrichor64 Logo",
      },
    ],
    site_name: "Petrichor64",
  }}
  twitter={{
    handle: "@MakeAvoy",
    site: "makeavoy.com",
    cardType: "summary_large_image",
    title: "Petrichor64 Website",
    description: "The Petrichor64 game engine official site and documentation",
    image: "https://petrichor64.app/p64.png",
    imageAlt: "Twitter image alt",
  }}
/>

<style>
  /* Hide everything above this component. */
  :global(#app),
  :global(body),
  :global(html) {
    display: block !important;
    width: auto !important;
    position: static !important;
  }
  :global(.default-tip) {
    transform: translate(25%, 0);
  }

  :global(.bottom-bg) {
    --mdc-theme-secondary: #932f7b;
    background-image: url("/tile-dark.png");
  }
  @media (prefers-color-scheme: light) {
    :global(.bottom-bg) {
      --mdc-theme-secondary: #002841;
      background-image: url("/tile.png");
    }
  }
  /* :global(.search-icon) {
    background-image: url("./search.png");
  } */
</style>
