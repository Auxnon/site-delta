// import * as THREE from "three";

// export class SceneManager {
//   emptyScene: THREE.Scene;
//   scenes: Promise<THREE.Scene>[];
//   activeScene: THREE.Scene | undefined;
//   activeModule;
//   alphaCanvas: HTMLElement;
//   betaCanvas: HTMLElement;
//   activeCanvas;
//   alphaReserved = false;
//   betaReserved = false;

//   constructor() {
//     this.emptyScene = new THREE.Scene();
//     this.scenes = [];

//     let cubeGeometry = new THREE.BoxGeometry(20, 20, 20);
//     let cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff8833 }); //map: texture

//     this.alphaCanvas = document.createElement("div");
//     this.betaCanvas = document.createElement("div");
//     this.alphaCanvas.classList.add("canvas-holder");
//     this.betaCanvas.classList.add("canvas-holder");
//     this.betaCanvas.style.background = "#fff5";

//     this.activeCanvas = this.alphaCanvas;
//     /*
//         var geometry = new THREE.SphereGeometry( 5, 32, 32 );
//         var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
//         var sphere = new THREE.Mesh( geometry, material );

//         sphere.position.set(0,0,-30);
//         cubes.push(sphere);
//         scenes[2].add(sphere);
//         var geo = new THREE.OctahedronGeometry( 30, 1 );
//         var mat = new THREE.MeshBasicMaterial( {color: 0xC92DD1} );
//         var octa= new THREE.Mesh( geo, mat );
//         octa.position.set(0,0,20);
//         cubes.push(octa);
//         scenes[3].add(octa);*/
//   }

//   sceneAnimate(delta: number) {
//     if (this.activeModule) {
//       this.activeModule.animate(delta);
//     }
//   }

//   // closeModule() {
//   //   if (this.activeModule && this.activeModule.close) this.activeModule.close();
//   // }

//   flipScene(i, targetContainer) {
//     // //this method contains some duplicate logic compared to getScene when loading is complete
//     let canvas = this.getAlphaCanvas();
//     // canvas.remove();
//     // this.activeScene = i;
//     // canvas.style.opacity = 1;
//     // //not proud of the setup but its better to isolate all the render logic out from the app opening mangement of Main
//     // //literally just checking the scene has fully loaded and to call its app open function
//     // let scene = this.scenes[i];
//     // if (scene != undefined && scene != "pend" && scene[1].open) {
//     //   if (!scene[1].open(canvas)) {
//     //     appDom.appendChild(canvas);
//     //   }
//     // } else appDom.appendChild(canvas);
//   }

//   getAndClearCanvas() {
//     this.alphaCanvas.innerHTML = ""; //TODO good enough?
//     return this.alphaCanvas;
//   }

//   getAlphaCanvas() {
//     return this.alphaCanvas;
//   }

//   getBetaCanvas() {
//     return this.betaCanvas;
//   }
//   setScene(scene: THREE.Scene) {
//     this.activeScene = scene;
//   }

//   getScene() {
//     // let index = this.activeScene;
//     // let scene = this.scenes[index];
//     // if( scene == undefined){
//     //   scene = this.emptyScene;
//     //   Main.APP_MODULES[index];
//     // this.scenes[index] = S

//     return this.activeScene || this.emptyScene;
//     // let index = this.activeScene;
//     // let outgoingScene = this.scenes[index];
//     // if (outgoingScene == undefined) {
//     // outgoingScene = this.emptyScene;
//     //     this.scenes[index] = "pend";
//     //     //wow this is a confusing mess but it's functional!
//     //     let importerFunction = SCENE_IMPORT[index];
//     //     if (importerFunction) {
//     //       system.pendApp(index);
//     //       importerFunction((module) => {
//     //         //set the scene index to our now loaded script, but due to some likely additional resources loadding in we're still pending
//     //         //when the resources are ALL loaded, per the loaded script's requirements, it calls the complete function that was passed it below
//     //         //This complete function should wrap up any remainder logic, such as removing hte loading animation, allowing hte scene to render, and calling the "open app" function
//     //         let initialScene = module.init(index, Main.apps[index], () => {
//     //           let canvas = this.getAlphaCanvas();
//     //           canvas.remove();
//     //           canvas.style.opacity = 1;
//     //           if (module.open && system.getCurrentAppId() == index) {
//     //             if (module.open(canvas)) {
//     //               system.clearPendApp(index);
//     //             } else system.clearPendApp(index, canvas);
//     //           } else system.clearPendApp(index, canvas);
//     //         });
//     //         if (!initialScene) initialScene = this.emptyScene;
//     //         this.scenes[index] = [initialScene, module];
//     //       });
//     //     } else {
//     //       this.scenes[index] = [this.emptyScene, undefined];
//     //     }
//     //     /*import(SCENE_DATA[index][0]).then(module => {
//     //           scenes[index] = module.init(SCENE_DATA[index][1], Render, THREE);
//     //       })*/
//     //   } else if (outgoingScene == "pend") {
//     //     outgoingScene = this.emptyScene;
//     //   } else {
//     //     this.activeModule = outgoingScene[1]; //define the module that's currently active so we can run it's animate function in sceneAnimate()
//     //     outgoingScene = outgoingScene[0]; //please forgive me, trust me it works
//     //   }
//     //   return outgoingScene;
//     // }
//     // // adjustModule(pos: number) {
//     // //   if (this.activeModule && this.activeModule.adjust)
//     // //     this.activeModule.adjust(pos);
//   }
// }

// // import * as THREE from "./lib/three.module.js";
// // import * as Render from "./Render.js";

// // var emptyScene;
// // var scenes;

// // var data = [
// //     [ /* webpackChunkName: "App1SkyIsland" */ './App1SkyIsland', 'Sky Island'],
// //     [ /* webpackChunkName: "App2Punk" */ './App2Punk', 'Punk App']
// // ]

// // function init() {
// //     emptyScene = new THREE.Scene();
// //     scenes = [];

// //     let cubeGeometry = new THREE.BoxBufferGeometry(20, 20, 20);
// //     let cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff8833 }); //map: texture
// //     for (let i = 2; i < 5; i++) {
// //         scenes[i] = new THREE.Scene();
// //     }
// // }

// // function animate() {
// //     if (activeScene == 0) {

// //     } else if (activeScene == 1) {

// //     }
// // }

// // function flipScene(i) {
// //     activeScene = i;
// // }
// // var activeScene = 0;

// // function getScene() {
// //     let index = activeScene;
// //     let scene = scenes[index];
// //     if (scene == undefined) {
// //         scene = emptyScene
// //         scenes[index] = 'pend';

// //         import(data[index][0]).then(module => {
// //             scenes[index] = module.init(data[index][1], Render, THREE);
// //         })
// //     } else if (scene == 'pend') {
// //         scene = emptyScene;
// //     }
// //     return scene;
// // }

// // export { init, animate, flipScene, getScene }
