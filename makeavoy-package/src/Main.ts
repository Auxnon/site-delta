import * as UI from "./UI";
import "./style/mainStyle.css";
import { Renderer } from "./Render";
import { System } from "./System";
import AppShell from "./types/AppShell";
import Shaper from "./Shaper";

/*CSS classes used

#brightness
.brightness--dark
*/
export let systemInstance: System = new System();

//We could have technically done imports as a variable input to the Render class import statement
//But webpack won't convert the chunk parameters correctly unless it's explicitly within an import statement
export const APP_MODULES = [
  undefined,
  import(/* webpackChunkName: "SkylandApp" */ "./apps/Skyland"),
  import(/* webpackChunkName: "PunkApp" */ "./apps/Punk"),
  import(/* webpackChunkName: "DataApp" */ "./apps/Data"),
  import(/* webpackChunkName: "AboutApp" */ "./apps/About"),
  import(/* webpackChunkName: "ChatApps" */ "./apps/Chat"),
  undefined,
  import(/* webpackChunkName: "App7Room" */ "./apps/Room"),
];

export const APP_IDS = {
  sky: 1,
  punk: 2,
  data: 3,
  portfolio: 4,
  chat: 5,
  donate: 6,
  room: 7,
};

let renderer: Renderer | undefined;
export const rendererPromise = import(
  /* webpackChunkName: "Render" */ "./Render"
).then((module) => {
  renderer = new module.Renderer();
  // renderer.init(SCENE_IMPORT, pendingRenderId); //if undefined it will just use 0, so we can directly input regardless
  console.log("3d Renderer loaded");
  // TODO pending renderId
  // if (pendingRenderId != undefined) {
  //   openAppApplyRender(pendingRenderId, appElements[pendingRenderId]);
  // }
  return renderer;
});

// const initer = (a: Promise<App>) => a.then((a) => a.init());

//doms
let apps: AppShell[];

let pendingRenderId; //if not undefined, wait for Render to load and then apply the scene

let currentAppId = -1;
let appSortingMode = false;

declare global {
  interface Window {
    TAU: number;
    UI: any;
  }
}
window.TAU = Math.PI * 2;

(function init() {
  window.UI = UI;
  let preApps = document.querySelectorAll(".app");
  apps = [];
  let assets: string[] = [];
  preApps.forEach((element, key) => {
    let html = element as HTMLElement;
    //convert out of a nodelist to an array, it matters trust me
    let i = parseInt(element.id.replace("app", ""));
    let className = "";
    let asset = "";
    switch (i) {
      case 1:
        className = "Skyland";
        asset = require("./assets/home.png");
        break;
      case 2:
        className = "Punk";
        asset = require("./assets/skull.png");
        break;
      case 3:
        className = "Data";
        asset = require("./assets/data.png");
        break;
      case 4:
        className = "About";
        asset = require("./assets/about.png");
        break;
      case 5:
        className = "Chat";
        asset = require("./assets/chat.png");
        break;
      case 7:
        className = "Room";
        asset = require("./assets/room.png");
        break;
    }
    let module = APP_MODULES[i];
    if (module !== undefined) {
      const shell: AppShell = new AppShell(html, i, className, module);

      apps[i] = shell;
      assets[key] = asset;
    }
  });

  systemInstance.init(apps);

  if (window.location.hash.length) {
    let st = window.location.hash.substring(1);
    let id = APP_IDS[st];
    if (id != undefined) systemInstance.openApp(id);
  }
  // button.onclick = e => import(/* webpackChunkName: "print" */ './print').then(module => {
  //     const print = module.default;

  //     print();
  //   });

  UI.init(document.body, 4);
  Shaper(Array.from(preApps).map((e, i) => [e as HTMLElement, assets[i]]));
})();

// function openAppApplyRender(id, app) {

//   let afterImage = document.querySelector("#afterImage");

//   afterImage.remove();

//   if (focused) {
//     focused.appendChild(afterImage);
//     afterImage.style.opacity = 1;
//     setTimeout(() => {
//       afterImage.style.opacity = 0;
//     }, 1);
//   } else {
//     //silly I know but it's just easier to keep the afterImage within the dom, even if in this logical case it's not used
//     afterImage.style.opacity = 0;
//     if (app == 1) appElements[2].appendChild(afterImage);
//     else appElements[1].appendChild(afterImage);
//   }
//   Render.bufferPrint();
//   Render.flipScene(id, app);
// }

// function rand() {
//   return Math.random() * 100 - 50;
// }

/*
function pointCheck(point,index){
    let d={x:point.x-targetMove.pos.x,y:point.y-targetMove.pos.y}
            let dr=Math.sqrt(d.x*d.x +d.y*d.y);


            if(dr<40){
                targetMove.pos={x:point.x-d.x/3,y:point.y-d.y/3}
                if(targetMove.moving){ //called once per state change
                    targetMove.moving=undefined
                    //targetMove.classList.remove('appMove')
                }
                if(point.app==targetMove){

                }else{ //switcheroo the app icons
                    //let oldPoint=appPoints[targetMove.spot];
                    let swapApp=point.app;
                    targetMove.spot=index;
                    apps.forEach(app=>{
                        if(app==targetMove){

                        }else{
                            if(app.pos.x>targetMove.pos.x){
                                _moveEle(app,64+app.pos.x,app.pos.y,true)
                            }else{
                                _moveEle(app,-64+app.pos.x,app.pos.y,true)
                            }
                        }

                    })


                }
            }else{
                if(!targetMove.moving){ //called once per state change
                    targetMove.moving=true;
                    //targetMove.classList.add('appMove')

                }
            }
}*/

export function getRenderer(): Renderer | undefined {
  return renderer;
}
