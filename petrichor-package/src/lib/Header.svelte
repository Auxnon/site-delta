<header class="header">
  <a href="/" target="_blank" rel="noreferrer">
    {#each { length: 12 } as _, i}
      <!-- <img src="./p64.png" class="logo" alt="Petrichor64 Logo" /> -->

      <img
        src="./p64.png"
        class="logo"
        alt="Petrichor64 Logo"
        style="--z:{-80 + i * 10}px; filter: contrast({(i * 100) / 12}%);"
      />
    {/each}
  </a>
</header>

<style>
  @keyframes rotate {
    0% {
      transform: rotate3d(0, 1, 0.1, 24deg) translate3d(0, 0, var(--z))
        perspective(100px);
    }
    100% {
      transform: rotate3d(0, 1, 0.1, -24deg) translate3d(0, 0, var(--z))
        perspective(100px);
    }
  }

  .header a {
    perspective: 100px;
    /* perspective-origin: -1000px 0px; */
  }
  .header {
    /* --z: 0px; */
    /* transform: rotate3d(1, 0, 0, 60deg); */
    /* transform: rotate3d(1, 0, 0, 14deg); */
    /* animation-name: rotate;
    animation-duration: 2s;
    animation-iteration-count: infinite;
    animation-direction: alternate;
    animation-timing-function: ease-in-out; */
    /* animation-delay: 0s; */
    /* animation: rotate 2s infinite alternate ease-in-out; */
    perspective: 100px;

    position: relative;
    height: 200px;
  }

  .logo {
    top: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: rotate3d(1, 0, 0, 60deg);
    animation: rotate 3s infinite alternate linear;
  }
</style>
