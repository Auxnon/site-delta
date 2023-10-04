import * as THREE from "three";
import * as Main from "../../Main";
import * as UI from "../../UI";
import "./about.scss";
import AppEnvironment from "../../types/AppEnvironment";
// import "./about.html";

//pass in name, and a pointer to a complete function which dictates everything has loaded,
//we keep track inside the mini class by counting  resources and incrementing till count is complete then, complte()
//animate is called every render, deint... not used yet
export default class About extends AppEnvironment {
  portrait;
  eye;
  eyeTimer = 0;

  // non 3d fields
  main: HTMLElement;
  overlay;
  resizeTimer;
  //let px = 0;
  //let moveTarget;
  currentSection;
  clickerOverlay;
  portfolioHolder;
  closeButton;
  holders: HTMLElement[] = [];

  holderSizes: number[] = [];
  timeouts: NodeJS.Timeout[] = [];
  portraitMode: boolean = false;
  doubleChecker: number = 0;
  checkIterator: number = 0;
  fitDelay?: NodeJS.Timeout;

  constructor(dom: HTMLElement, id: number) {
    super(dom, id);
    this.scene = new THREE.Scene();
    var ambientLight = new THREE.AmbientLight(0xffffff); // soft white light
    this.scene.add(ambientLight);
    var sunLight = new THREE.DirectionalLight(0xffffff, 0.6); //DirectionalLight
    sunLight.position.set(-1, -6, 10);
    this.scene.add(sunLight);
    Main.rendererPromise.then((renderer) => {
      renderer
        .loadModel("assets/models/portrait.glb", undefined, undefined, true)
        .then((m) => {
          this.portrait = m;
          m.position.set(0, -196, 95.5);
          // @ts-ignore
          window.portrait = this.portrait;

          this.scene.add(m);
          this.portrait.children.forEach((c) => {
            if (c.name == "Eye") this.eye = c;
          });

          //@ts-ignore
          window.portrait = this.portrait;
        });
    });

    fetch("/apps/About/about.html")
      .then(function (response) {
        return response.text();
      })
      .then((html) => {
        // This is the HTML from our response as a text string

        dom.insertAdjacentHTML("beforeend", html);
        /*dom.addEventListener("DOMContentLoaded", function(){
            console.log('TEST7') //FIX
        })*/
        this.initAbout(dom);
        this.emailFixer(dom);
        this.checkDone();
        this.fitAll(true);
      })
      .catch(function (err) {
        // There was an error
        console.warn("Something went wrong.", err);
      });
    this.checkAspect();
    this.fitAll(true);
  }

  animate(delta: number) {
    if (this.portrait) {
      let pos = Main.systemInstance.getPosPercent();
      this.portrait.rotation.y = (-0.25 + pos.x / 2.0) * Math.PI;
      this.portrait.rotation.x = (0.25 + pos.y / 6.0) * Math.PI;
      if (this.eye) {
        this.eyeTimer++;
        if (this.eyeTimer > 200 && this.eyeTimer < 220) {
          let v;
          if (this.eyeTimer > 210) v = (this.eyeTimer - 210) / 10;
          else v = 1 - (this.eyeTimer - 200) / 10;
          this.eye.scale.set(1, v, 1);
        } else if (this.eyeTimer >= 220) this.eyeTimer = 0;
      }
    }

    this.doubleChecker++;
    if (this.doubleChecker > 100) {
      this.doubleChecker = 0;

      // const s = this.main.querySelectorAll("section");
      // if (s.length > 0) {
      //   this.checkIterator++;
      //   console.log("check " + this.checkIterator);
      //   const i = this.checkIterator % s.length;
      //   this.fitSection(s[i], i);
      //   if (this.checkIterator >= s.length) {
      //     this.checkIterator = 0;
      //   }
      // }
      this.fitAll(false);
    }
  }

  deinit() {}

  open(canvas?: HTMLElement) {
    //main.querySelector()
    Main.systemInstance.shrinkTitle();

    //console.log('opened')
    //UI.systemMessage('test ' + window.innerWidth + '; screen ' + window.screen.width, 'success')
    if (this.main && canvas) {
      let holder = this.main.querySelector(".portrait-holder");

      // canvas.custom = 256;
      if (holder) holder.appendChild(canvas);
      Main.renderer?.resize();
    }

    this.hideOverlay();
    setTimeout(() => {
      if (this.main) {
        this.main.style.display = "initial";
        this.normalize();
        void this.main.offsetWidth;
        this.main.style.opacity = "1";
        setTimeout(() => {
          this.unhideOverlay();
        }, 900);
      }
    }, 100);
    return true;
  }

  checkDone() {
    // DEV we want to show something sooner rather than later
    this.resolver();
  }

  close() {
    if (this.main) {
      this.hideOverlay();
      this.main.style.opacity = "0";
      setTimeout(() => {
        this.main.style.display = "none";
      }, 200);
      Main.renderer?.resize();
      this.closeAll();
    }
  }

  ///==========non 3d page logic===========

  initAbout(dom) {
    this.main = dom.querySelector("main");
    let underlay1 = this.main.querySelector(".portfolio-underlay");
    this.overlay = this.main.querySelector(".portfolio-overlay");
    this.clickerOverlay = this.main.querySelector(".portfolio-clicker");
    if (!underlay1) {
      UI.systemMessage("Issue with page", "error");
      return;
    }
    const underlay = underlay1 as HTMLElement;

    let contactPanel = underlay.firstElementChild;

    this.main.querySelectorAll("section").forEach((section, i) => {
      let holder = document.createElement("div");
      holder.className = "section-holder";
      holder.id = "portfolio-section-holder" + i;
      this.holders.push(holder);
      section.id = "portfolio-section" + i;
      underlay.insertBefore(holder, contactPanel);
      section.tabIndex = i;
      section.setAttribute("holderId", `${i}`);

      section.className = "shrink";

      section.addEventListener("focus", (ev) => {
        this.selectSection(ev.target as HTMLElement);
      });

      section.addEventListener("click", (ev) => {
        this.selectSection(section);
      });
      const image = section.querySelector("image");
      if (image) image.addEventListener("load", (ev) => this.loadListener(ev));

      let video = section.querySelector("video");
      if (video)
        video.addEventListener("loadeddata", (ev) => this.loadListener(ev));
    });
    this.clickerOverlay.addEventListener("click", () => this.closeAll());
    this.closeButton = this.main.querySelector("#close-button");
    if (this.closeButton)
      this.closeButton.addEventListener("click", () => this.closeAll());

    setTimeout(() => {
      this.normalize();
    }, 1); //make sure DOM is done
    let portraitHolder: HTMLElement = this.main.querySelector(
      ".portrait-holder"
    ) as any;
    this.portfolioHolder = this.main.querySelector(".portfolio-section-block");
    // this.portfolioHolder.addEventListener("scroll", (ev) => {
    //   if (ev.target.scrollTop > 0) {
    //     portraitHolder.style.height = "128px";
    //     portraitHolder.style.transform = "translate(-50%) scale(0.5,0.5)";
    //     //portfolioHolder.style.height='calc(100% - 128px)'
    //   } else {
    //     portraitHolder.style.height = "";
    //     portraitHolder.style.transform = "";
    //     //portfolioHolder.style.height=''
    //   }
    // });
    window.addEventListener("keydown", (ev) => {
      /*if(ev.which==32)
            fit();*/
      console.log(ev.which);

      if (this.currentSection) {
        if (ev.which == 27) {
          this.closeAll();
        } else if (ev.which == 37) {
          //left
          if (
            this.currentSection.previousElementSibling == null ||
            this.currentSection.previousElementSibling == this.clickerOverlay
          )
            this.selectSection(
              this.currentSection.parentElement.lastElementChild
            );
          else this.selectSection(this.currentSection.previousElementSibling);
        } else if (ev.which == 39) {
          //right //|| ev.which == 32
          if (this.currentSection.nextElementSibling == null)
            this.selectSection(this.currentSection.parentElement.children[1]);
          else this.selectSection(this.currentSection.nextElementSibling);
        }
      } else if (ev.which == 27 || ev.which == 39) {
        //ev.which == 32
        this.selectSection(this.main.querySelector("section"));
      }
    });
  }

  resized(): void {
    this.checkAspect();
    this.unhideOverlay();
    this.fitAll(true);
  }

  startResize(): void {
    this.hideOverlay();
  }

  checkAspect() {
    const newAspect = window.matchMedia(
      "(max-aspect-ratio: 1/1) and (max-device-width: 600px)"
    ).matches;
    if (newAspect != this.portraitMode) {
      this.portraitMode = newAspect;
    }
  }

  selectSection(section: HTMLElement | null | undefined) {
    if (section) {
      this.shrinkAll(section);

      let vid = section.querySelector("video");
      if (vid) vid.play();

      this.main.classList.add("portfolio-opened");
      section.className = "";
      section.style.left = "50%";
      this.closeButton.style.display = "block";
      section.addEventListener("scroll", this.sectionScrollChecker);
      let sHeight = section.parentElement?.parentElement?.scrollTop || 0;
      let height = window.innerHeight; //section.parentElement.parentElement.offsetHeight
      //UI.systemMessage('sheight'+sHeight+' height '+height,'warn')
      section.style.top =
        height / 2 +
        sHeight -
        (section.parentElement?.offsetTop || 0) -
        64 +
        "px";
      section.focus();
      section.style.zIndex = "3";

      this.currentSection = section;
      // setTimeout(() => this.fit(), 1);
    } else this.closeAll();
  }

  /** close clicker and resize all items */
  normalize() {
    this.fitAll(false);
    this.clickerOverlay.style.zIndex = 2;
  }

  fitAll(force: boolean, immediate?: boolean) {
    if (!this.main) return;
    const list = Array.from(this.main.querySelectorAll("section"));
    const sizes = list.map((section, i) => {
      const media = section.querySelector("img, video") as HTMLElement;
      if (media) {
        let ratio = 1;
        if (media instanceof HTMLVideoElement) {
          ratio = media.videoWidth / media.videoHeight;
        } else if (media instanceof HTMLImageElement) {
          ratio = media.naturalWidth / media.naturalHeight;
        }

        if (this.portraitMode) {
          return media.offsetWidth / ratio;
        } else {
          const height = 144;
          return height * ratio;
        }
      }
      return 100;
    });

    if (!force && sizes.every((v, i) => v == this.holderSizes[i])) return;
    console.log("%cFit All", "color: red");
    console.log(sizes);
    this.holderSizes = sizes;

    list.forEach((section, i) => {
      this.fitSection(section, i, immediate);
    });
  }

  fit() {}

  fitSection(section: HTMLElement, i: number, immediate?: boolean) {
    section.scrollTo(0, 0);
    if (this.timeouts[i]) clearTimeout(this.timeouts[i]);
    if (section.className == "shrink") {
      const id = section.getAttribute("holderId");
      if (!id) return;
      let holder = this.holders[id];
      const f = this.holderSizes[i];
      if (this.portraitMode) {
        holder.style.height = `${f}px`;
        holder.style.flexBasis = "";
      } else {
        holder.style.flexBasis = `${f}px`;
        holder.style.height = "";
      }
      const timeout = immediate ? 0 : 1000 * Math.random();
      this.timeouts[i] = setTimeout(() => {
        section.style.left =
          holder.offsetLeft +
          holder.offsetWidth / 2 -
          section.offsetWidth / 2 +
          "px";
        section.style.top = holder.offsetTop + "px";
        section.style.zIndex = "0";
      }, timeout);
    } else section.style.zIndex = "3";
  }

  loadListener(ev) {
    const content = ev.target;
    const section = content.parentElement;
    // const holder = this.holders[section.getAttribute("holderId")];
    // holder.style.flexBasis = `${content.offsetWidth}px`;
    this.fitAll(false);
    if (ev.target["videoHeight"] == undefined)
      ev.target.removeEventListener("load", this.loadListener);
    else ev.target.removeEventListener("loadeddata", this.loadListener);
    // console.log("late load");
  }

  shrinkAll(skip?: HTMLElement) {
    this.main.querySelectorAll("section").forEach((s) => {
      if (s.className != "shrink" && s != skip) {
        s.className = "shrink";
        s.removeEventListener("scroll", this.sectionScrollChecker);
        let vid = s.querySelector("video");
        if (vid) vid.pause();
      }
    });
    this.fitAll(true);
  }

  closeAll() {
    this.shrinkAll();

    this.main.classList.remove("portfolio-opened");
    this.currentSection = null;
    this.closeButton.style.display = "";
  }

  hideOverlay() {
    this.overlay.style.opacity = 0;
    console.log("hide");
  }

  unhideOverlay() {
    this.normalize();
    this.overlay.style.opacity = 1;
  }

  emailFixer(dom) {
    let emailButton = dom.querySelector(".mail-link");

    const emailButtonOverride = (ev) => {
      const str = "CWa[Wleo6]cW_b$Yec"; // crappy obfuscation

      let array = str.split("");

      let shiftedArray = array.map((val, i) => {
        return String.fromCharCode(val.charCodeAt(0) + 10);
      });
      let newString = shiftedArray.join("");
      window.location.href = "mailto:" + newString;

      ev.preventDefault();
      return false;
    };

    emailButton.addEventListener("click", emailButtonOverride);
  }

  sectionScrollChecker(ev) {}
}
