import * as THREE from "three";
import * as Render from "../Render";
import * as Main from "../Main";
import AppEnvironment from "../types/AppEnvironment";

let greenModel;

export default class Skyland extends AppEnvironment {
  value: number = 0;
  dir: number = 1;
  constructor(dom: HTMLElement, id: number) {
    super(dom, id);
    let scene = new THREE.Scene();

    Main.rendererPromise.then((renderer) => {
      renderer.loadModel("assets/models/island.glb").then((m) => {
        greenModel = m;
        greenModel.position.set(0, 260, -40);
        greenModel.scale.set(10, 10, 10);
        scene.add(greenModel);
        this.resolver();
      });
    });
    /*
        Render.loadModel('assets/tree.gltf',function(m){
           //m.scale.set(10,10,10)
           // m.position.set(0,160,-40)
           greenModel.add(m);
        })*/
    {
      var ambientLight = new THREE.AmbientLight(0xffffff); // soft white light
      scene.add(ambientLight);
      var sunLight = new THREE.DirectionalLight(0xffffff, 1); //DirectionalLight
      sunLight.position.set(100, 100, 200);
      // window.sunLight = sunLight;
      // window.Main = Main;
      sunLight.castShadow = true;
      scene.add(sunLight);
      var sunTarget = new THREE.Object3D();
      sunTarget.position.set(-20, 0, -20);
      scene.add(sunTarget);
      sunLight.target = sunTarget;
    }
    this.scene = scene;

    // return scene;
  }

  animate(delta) {
    if (greenModel) {
      this.value += 0.05 * this.dir * delta;
      if (this.value > 1 || this.value < 0) {
        this.dir = -this.dir;
      }
      greenModel.rotation.y = 5.4 + this.value * 0.6; //5.2 - 6
      //m.position.set(0,260,-40)
      let pos = Main.systemInstance.getPosPercent();
      greenModel.position.set(
        30 - 30 * this.value + (pos.x - 0.2) * 30,
        -80 + 340 * this.value,
        20 - 60 * this.value + (pos.y - 0.5) * -30
      );
      // x: 30, y: -80, z: 20
      //console.log(greenModel.rotation.y)
    }
  }

  deinit() {}
}
