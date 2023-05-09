import * as THREE from "../lib/three.module";
import * as Render from "../Render";
import * as Main from "../Main";
import { App } from "../app.type";

export class Punk extends App {
  skull: THREE.Group;
  aniFactor = 0;
  speed = 20;
  dir = this.speed;
  group;
  moveGroups;

  constructor(dom) {
    super(dom);
    this.scene = new THREE.Scene();

    let ambientLight = new THREE.AmbientLight(0xffffff); // soft white light
    this.scene.add(ambientLight);
    let sunLight = new THREE.DirectionalLight(0xffffff, 0.6); //DirectionalLight
    sunLight.position.set(0, 1, 0);
    sunLight.castShadow = true;
    this.scene.add(sunLight);
    let sunTarget = new THREE.Object3D();
    sunTarget.position.set(-20, 0, -20);
    this.scene.add(sunTarget);
    sunLight.target = sunTarget;

    Main.rendererPromise.then((renderer) => {
      renderer.loadModel("assets/skull.glb").then((m) => {
        this.skull = m;
        m.position.set(0, 160, 70);
        m.scale.set(6, 6, 6);
        m.rotation.y = -Math.PI / 2; //pi2 to pi
        this.scene.add(m);
        this.resolver();
        // window.skull = skull;
      });
      this.group = new THREE.Group();

      let streetMesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(2, 6, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xebd7fe })
      );

      let lamp1 = new THREE.Mesh(
        new THREE.BoxBufferGeometry(2, 2, 12),
        new THREE.MeshStandardMaterial({ color: 0xfda3a8 })
      );
      let lamp2 = new THREE.Mesh(
        new THREE.BoxBufferGeometry(8, 4, 1),
        new THREE.MeshStandardMaterial({ color: 0xfda3a8 })
      );
      let lamp = new THREE.Group();
      lamp.add(lamp1);
      lamp2.position.set(3, 0, 6);
      lamp.add(lamp2);
      lamp.position.set(-23, 0, -14);
      let mats = [
        new THREE.MeshStandardMaterial({ color: 0x6e2e6f }),
        new THREE.MeshStandardMaterial({ color: 0x432e6f }),
        new THREE.MeshStandardMaterial({ color: 0x142a7d }),
      ];
      this.moveGroups = [];
      for (let j = 0; j < 5; j++) {
        if (j != 2)
          for (let i = 0; i < 20; i++) {
            if (!this.moveGroups[i]) {
              this.moveGroups[i] = new THREE.Group();
              this.moveGroups[i].position.y = -160 + i * 40;

              let street = streetMesh.clone();
              let street2 = streetMesh.clone();
              street.position.set(0, 7, -19.8);
              street2.position.set(0, 7, -19.8);
              if (i % 4 == 0) {
                let lampClone = lamp.clone();
                let lampClone2 = lamp.clone();
                lampClone2.rotation.z = window.TAU / 2;
                lampClone2.position.set(23, 0, -14);
                this.moveGroups[i].add(lampClone);
                this.moveGroups[i].add(lampClone2);
              }

              this.moveGroups[i].add(street);
              this.moveGroups[i].add(street2);

              this.group.add(this.moveGroups[i]);
            }

            let high = 20 + Math.random() * 88;
            let cube = new THREE.Mesh(
              new THREE.BoxBufferGeometry(26, 26, high),
              mats[Math.floor(Math.random() * 3)]
            );
            cube.position.set((j - 2) * 40, 0, -20 + high / 2);
            this.moveGroups[i].add(cube);
          }
      }
      let road = new THREE.Mesh(
        new THREE.BoxBufferGeometry(44, 32 * 40, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x791bc6 })
      );
      road.position.set(0, 16 * 40 - 200, -20);
      this.group.add(road);

      let sunMat = new THREE.MeshBasicMaterial({ color: 0xff687c }); //0xFF687C
      let sunGroup = new THREE.Group();

      let circ = new THREE.Mesh(
        new THREE.CircleGeometry(128, 6, 0, Math.PI),
        sunMat
      );
      let p1 = new THREE.Mesh(new THREE.PlaneGeometry(256, 16), sunMat);
      let p2 = new THREE.Mesh(new THREE.PlaneGeometry(240, 16), sunMat);
      let p3 = new THREE.Mesh(new THREE.PlaneGeometry(210, 16), sunMat);
      let p4 = new THREE.Mesh(new THREE.PlaneGeometry(150, 16), sunMat);

      p1.position.set(0, -15, 0);
      p2.position.set(0, -30 - 8, 0);
      p3.position.set(0, -45 - 24, 0);
      p4.position.set(0, -60 - 40, 0);
      sunGroup.add(circ);
      sunGroup.add(p1);
      sunGroup.add(p2);
      sunGroup.add(p3);
      sunGroup.add(p4);

      sunGroup.rotation.x = Math.PI / 2;
      sunGroup.position.set(0, 64 * 40, 256);

      this.group.add(sunGroup);

      //let circle= new THREE.Mesh(new THREE.BoxBufferGeometry(44, 64*40, 0.2),);

      //let geo = new THREE.BoxBufferGeometry(factor / 2, 10, 15)
      //let cube = new THREE.Mesh(geo, );
      this.scene.add(this.group);
      // return scene;
    });
  }

  animate(delta) {
    if (this.skull) {
      this.aniFactor += this.dir * delta;
      if (this.aniFactor > 100) {
        this.dir = -this.speed;
        this.aniFactor = 100;
      } else if (this.aniFactor < 0) {
        this.dir = this.speed;
        this.aniFactor = 0;
      }
      this.skull.children[1].rotation.z = (-0.6 * (this.aniFactor % 10)) / 10.0;

      this.skull.rotation.y = Math.PI + (Math.PI * this.aniFactor) / 100.0;
      this.skull.rotation.z =
        ((-Math.PI / 8) * (50 - Math.abs(this.aniFactor - 50))) / 50;

      let pos = Main.system.getPosPercent();
      this.group.position.x = pos.x * 32 - 16;
      this.group.position.z = -(1 - pos.y) * 20;

      this.group.rotation.x =
        -Math.PI / 6 + ((this.aniFactor / 100.0) * Math.PI) / 16;
      this.moveGroups.forEach((move) => {
        move.position.y -= 2 + (1 - pos.y) * 16;
        if (move.position.y < -200)
          move.position.y = -60 + this.moveGroups.length * 32;
      });
    }
  }

  deinit() {}
}
