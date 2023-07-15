import * as UI from "./UI";
import "./style/mainStyle.scss";
import { Renderer } from "./Render";
import { System } from "./System";
import AppShell from "./types/AppShell";
import Shaper from "./Shaper";

/*CSS classes used

#brightness
.brightness--dark
*/
export let systemInstance: System = new System();

const main_container: HTMLElement = document.querySelector("#main");
//We could have technically done imports as a variable input to the Render class import statement
//But webpack won't convert the chunk parameters correctly unless it's explicitly within an import statement
export const APPS: AppShell[] = [];

APPS[1] = new AppShell(
  main_container,
  1,
  "Skyland",
  require("./assets/home.png"),
  import(/* webpackChunkName: "SkylandApp" */ "./apps/Skyland")
);

APPS[2] = new AppShell(
  main_container,
  2,
  "Punk",
  require("./assets/skull.png"),
  import(/* webpackChunkName: "PunkApp" */ "./apps/Punk")
);

APPS[3] = new AppShell(
  main_container,
  3,
  "Data",
  require("./assets/data.png"),
  import(/* webpackChunkName: "DataApp" */ "./apps/Data")
);

APPS[4] = new AppShell(
  main_container,
  4,
  "About",
  require("./assets/about.png"),
  import(/* webpackChunkName: "AboutApp" */ "./apps/About")
);

// APPS[5] = new AppShell(
//   main_container,
//   5,
//   "Chat",
//   require("./assets/chat.png"),
//   import(/* webpackChunkName: "ChatApps" */ "./apps/Chat")
// );

APPS[7] = new AppShell(
  main_container,
  7,
  "Room",
  require("./assets/room.png"),
  import(/* webpackChunkName: "App7Room" */ "./apps/Room")
);

APPS[8] = new AppShell(
  main_container,
  8,
  "Blog",
  require("./assets/blog.png"),
  import(/* webpackChunkName: "App8Blog" */ "./apps/Blog")
);

export const APP_IDS = {
  sky: 1,
  punk: 2,
  data: 3,
  portfolio: 4,
  chat: 5,
  donate: 6,
  room: 7,
  blog: 8,
};

export let renderer: Renderer | undefined;
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

(function init() {
  systemInstance.init();

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
