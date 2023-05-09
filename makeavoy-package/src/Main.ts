import * as UI from "./UI";
import { App, AppShell } from "./app.type";
import "./style/mainStyle.css";
import { Renderer } from "./Render";
import { System } from "./System";

/*CSS classes used

#brightness
.brightness--dark
*/

//We could have technically done imports as a variable input to the Render class import statement
//But webpack won't convert the chunk parameters correctly unless it's explicitly within an import statement
export const APP_MODULES = [
  undefined,
  import(/* webpackChunkName: "App1SkyIsland" */ "./apps/Skyland"),
  import(/* webpackChunkName: "App2Punk" */ "./apps/Punk"),
  import(/* webpackChunkName: "App3Data" */ "./apps/Data"),
  import(/* webpackChunkName: "App4About" */ "./apps/About"),
  import(/* webpackChunkName: "App5Chat" */ "./apps/Chat"),
  undefined,
  import(/* webpackChunkName: "App7Room" */ "./apps/Room"),
];
//for now we need all these filled with some kind of data, no undefineds
export const APP_HASHES = {
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

export let system: System;

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
  preApps.forEach((element) => {
    let html = element as HTMLElement;
    //convert out of a nodelist to an array, it matters trust me
    let i = parseInt(element.id.replace("app", ""));
    let className = "";
    switch (i) {
      case 1:
        className = "Skyland";
        break;
      case 2:
        className = "Punk";
        break;
      case 3:
        className = "Data";
        break;
      case 4:
        className = "About";
        break;
      case 5:
        className = "Chat";
        break;
      case 7:
        className = "Room";
        break;
    }
    const shell: AppShell = new AppShell(html, i, className);

    // const app:App = Object.create(window[className].prototype);
    // app.constructor.apply(app, new Array("World"));
    // if (app && app instanceof App) apps[i] = app;
    apps[i] = shell;
  });

  system = new System(apps);

  if (window.location.hash.length) {
    let st = window.location.hash.substring(1);
    let id = APP_HASHES[st];
    if (id != undefined) system.openApp(id);
  }
  // button.onclick = e => import(/* webpackChunkName: "print" */ './print').then(module => {
  //     const print = module.default;

  //     print();
  //   });

  UI.init(document.body, 4);
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
