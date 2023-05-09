import * as THREE from "three";
import * as Render from "../Render";
import * as Main from "../Main";
import { App } from "../app.type";

//pass in name, and a pointer to a complete function which dictates everything has loaded,
//we keep track inside the mini class by counting  resources and incrementing till count is complete then, complte()
//animate is called every render, deint... not used yet

//called at first run, plugs in all the goods
export class Room extends App {
  group;
  plane;
  targetNode;
  sunLight;
  SHADOW_SIZE = 2048;

  xMatrix: THREE.Quaternion;
  zMatrix;

  iterate = 0;
  timer = 0;
  offsets = [0, 0.2, 0.4, 0.6, 0.8, -0.8, -0.6, -0.4];
  current = 0;

  init(dom, complete) {
    (this.zMatrix = new THREE.Quaternion()),
      (this.xMatrix = new THREE.Quaternion());
    this.xMatrix.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    let scene = new THREE.Scene();
    this.group = new THREE.Group();
    let geom = new THREE.BoxGeometry(10, 10, 1);
    let mat = new THREE.MeshStandardMaterial({ color: 0xffcd00 }); //, side: THREE.BackSide });
    let room = new THREE.Mesh(geom, mat);
    room.position.z = -4;
    room.receiveShadow = true;
    this.group.add(room);
    this.group.scale.set(10, 10, 10);
    this.group.position.z = 20;

    let ambientLight = new THREE.AmbientLight(0xffffff); // soft white light
    scene.add(ambientLight);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.6); //DirectionalLight
    this.sunLight.position.set(0, 0, 100);
    this.sunLight.castShadow = true;
    //sunLight.castShadow = true;
    let sunTarget = new THREE.Object3D();
    sunTarget.position.set(200, 0, 20);

    let seat = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0x78725b })
    );
    seat.position.set(0, 0, -2);
    seat.castShadow = true;
    this.targetNode = seat;
    this.group.add(seat);

    //sunLight.target = seat;
    scene.add(this.sunLight.target);

    this.sunLight.shadow.mapSize.width = this.SHADOW_SIZE; // default
    this.sunLight.shadow.mapSize.height = this.SHADOW_SIZE; // default
    this.sunLight.shadow.camera.near = 1; // default
    this.sunLight.shadow.camera.far = 100;
    // default

    let d1 = 75;
    this.sunLight.shadow.camera.left = -d1;
    this.sunLight.shadow.camera.right = d1;
    this.sunLight.shadow.camera.top = d1;
    this.sunLight.shadow.camera.bottom = -d1;

    this.sunLight.shadow.radius = 2.2; //2.2;
    this.sunLight.shadow.bias = -0.0005;

    scene.add(ambientLight);
    scene.add(this.sunLight);
    let debugLightHelper = new THREE.CameraHelper(this.sunLight.shadow.camera);
    scene.add(debugLightHelper);
    debugLightHelper.update();
    // @ts-ignore
    window.debugLightHelper = debugLightHelper;
    /*
        let pillar = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 6), new THREE.MeshStandardMaterial({ color: 0xFF274B }))
        pillar.position.set(0, 5, 0)
        group.add(pillar);
    */

    let texture = new THREE.TextureLoader().load("assets/room/bitmap.png");
    texture.wrapS = THREE.RepeatWrapping;

    let doubleMat = new THREE.MeshBasicMaterial({
      color: 0xffcd00,
      side: THREE.DoubleSide,
      map: texture,
      transparent: true,
    });
    let planeGeo = new THREE.PlaneGeometry(2, 3);
    // TODO
    // planeGeo.faceVertexUvs[0].forEach((ar) => {
    //   ar.forEach((v) => {
    //     if (v.x == 1) v.x = 0.2;
    //   });
    // });
    this.plane = new THREE.Mesh(planeGeo, doubleMat);
    this.plane.position.set(0, -3, -0.25);
    this.plane.rotation.set(window.TAU / 4, 0, 0);
    this.group.add(this.plane);

    Main.rendererPromise.then((renderer) => {
      renderer.loadModel("assets/room/couch.glb").then((m) => {
        //=.children[0]
        m.position.set(0, -3, -2.5);
        m.rotation.set(0, 0, window.TAU / 2);
        m.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.material = new THREE.MeshPhongMaterial({ color: 0xff274b });
          }
        });

        m.castShadow = true;
        m.receiveShadow = true;

        this.group.add(m);
      });

      renderer.loadModel("assets/room/tv.glb").then((m) => {
        //=.children[0]
        m.position.set(0, 4, -2.5);
        //m.rotation.set(0,0,TAU/2)
        //window.m=m;
        m.castShadow = true;
        m.receiveShadow = true;
        this.group.add(m);
      });
    });

    scene.add(this.group);
    dom.style.stroke = "none";
    let svg = this.convertSVG(null, dom);
    complete();
    return scene;
  }

  animate(delta) {
    this.group.rotation.z += delta / 1.0;
    if (this.group.rotation.z > Math.PI) this.group.rotation.z = -Math.PI;

    let pos = Main.system.getPosPercent();
    this.sunLight.target.position.set(pos.x * 100 - 50, pos.y * 10 - 5, 0);
    this.targetNode.position.set(pos.x * 10 - 5, pos.y * 10 - 5, -2);

    this.zMatrix.setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      -this.group.rotation.z
    );
    this.zMatrix.multiply(this.xMatrix);
    //console.log(zMatrix)
    //plane.lookAt(Render.getCamera().position);
    this.plane.quaternion.copy(this.zMatrix);
    //plane.rotation.x=TAU/4
    //plane.rotation.y=0;
    let degree = window.TAU / this.offsets.length / 2;
    let z = this.group.rotation.z;

    //z=(z > 0 ? z : (TAU + z))+degree
    let dir = z > 0;

    z = Math.abs(z) / Math.PI;

    let offset = 0;

    if (z < 0.125) offset = 0.8; // 0
    else if (z < 0.375) offset = 0.6; //.25
    else if (z < 0.625) offset = 0.4; //.5
    else if (z < 0.875) offset = 0.2;

    let texture = this.plane.material.map;

    this.plane.scale.set(dir ? 1 : -1, 1, 1);

    texture.offset.x = offset;

    this.current = offset;
  }

  //unused for now, would deload everything for memory reasons
  deinit() {}

  //called when toggled to this app, on a page load with app ideally it would run init and immediately run open after
  //also passes in the canvas in case the app wants to do something wacky with it like resize it or place it somewhere else
  //return true if changes were made and it wont follow the default
  open(canvas) {}
  //called when app is closed out for another one
  close() {}

  convertSVG(ele, dom) {
    /*let {width,height}=ele.getBBox();
    let svg=ele.cloneNode(true);
    let blob=new Blob([svg.outerHTML],{type: 'image/svg+xml;charset=utf-8'});
    let url=;//window.URL || window.webkitURL || window;
    let blobURL = URL.createObjectURL(blob);*/
    let width = 64,
      height = 64;
    let image = new Image();
    image.onload = () => {
      let canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      let context = canvas.getContext("2d");
      (canvas.style.position = "absolute"), (canvas.style.left = "0px");
      canvas.style.top = "0px";
      canvas.style.transform = "scale(10,10)";
      context.drawImage(image, 0, 0, width, height);
      dom.appendChild(canvas);
    };
    fetch("assets/room/check.svg")
      .then((response) => response.text())
      .then((svgString) => {
        //let outty=dom.insertAdjacentHTML("afterbegin", svg)
        const fragment = document
          .createRange()
          .createContextualFragment(svgString);
        let svg = fragment.children[0] as HTMLElement;
        this.topper(svg);
        this.svgProcess(svg);
        dom.appendChild(svg);
        //document.getElementById('parent').appendChild(fragment);
        /*

            let { w, h } = svg.getBBox();
            width = w;
            height = h;
            let svg2 = fragment.cloneNode(true);
            let blob = new Blob([svg2.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
            let url = window.URL || window.webkitURL || window;
            let blobURL = URL.createObjectURL(blob);
            image.src = blobURL;

*/
      });
    /*

        image.src='assets/room/check.svg';//blobURL;
        dom.appendChild(image)*/
  }

  topper(ele: HTMLElement) {
    (ele.style.position = "absolute"), (ele.style.left = "0px");
    ele.style.top = "0px";
  }

  svgProcess(svg: HTMLElement) {
    let og = [];
    let paths = Array.from(svg.querySelectorAll("path"));
    this.svgShake(paths, og);
  }

  svgShake(paths: SVGPathElement[], og: string[]) {
    //DEV FIX this function is ugly as sin / inefficient
    if (paths.length) {
      for (let k = 0; k < paths.length; k++) {
        let path = paths[k];

        let d: string;
        if (!og[k]) {
          d = path.getAttribute("d");
          og[k] = d;
        } else {
          d = og[k];
        }
        console.log("before " + d);

        let ns = "";
        let points = this.chunkPath(d);
        for (let i = 0; i < points.length - 1; i += 2) {
          let letter = points[i];
          ns += letter;
          letter = letter.toUpperCase();
          if (
            letter == "M" ||
            letter == "L" ||
            letter == "C" ||
            letter == "S"
          ) {
            let s = points[i + 1].trim();
            //let params=s.split(" ");
            let params = s.split(/(?=-)| /gi);
            /*if(selectedPath){
                            let selector=$("<div class='selector'/>");
                            selector.css({left:xy[0]+"px",top:xy[1]+"px"});
                            selector.attr("id","S"+i);
                        //let circle=$("<circle cx="+xy[0]+" cy="+xy[1]+" r=4 fill=cyan />");
                            selectorArea.append(selector);
                        //overlay.append(circle);
                            selector.on("mousedown",dragPoint).on("touchstart",dragPoint);
                        }*/

            for (let j = 0; j < params.length; j++) {
              let val = parseFloat(params[j]);
              val += (Math.floor(100 * Math.random()) / 100 - 0.5) * 1.5;
              ns += val + " ";
            }
            //lookahead include minus sign /(?=-)/g
          } else if (letter == "A") {
            let s = points[i + 1].trim();
            let params = s.split(/(?=-)| /g);
            if (params.length < 7) {
              //missing our flag values
            }
            [3];
          } else if (letter == "V" || letter == "H") {
            //registerPoint(parseInt(xy[0]),parseInt(xy[1]),id,i);
            let s = points[i + 1].trim();
            let val = parseFloat(s);
            val += (Math.floor(100 * Math.random()) / 100 - 0.5) * 1.5;
            ns += val + " ";
          } else if (letter == "A") {
            let s = points[i + 1].trim();
            let params = s.split(/(?=-)| /gi);
            if (params.length < 7) {
              if (params.length < 6) {
                let p = params[3][0];
                let p2 = params[3][1];
                params.splice(3, 0, p);
                params.splice(4, 0, p2);
              } else {
                let p = params[3][0];
                params.splice(3, 0, p);
              }
            }
            //let val=parseFloat(s);
            for (let j = 0; j < params.length; j++) {
              if (j != 3 && j != 4) {
                //avoid modifying the flags
                let val = parseFloat(params[j]);
                val += (Math.floor(100 * Math.random()) / 100 - 0.5) * 1.5;
                ns += val + " ";
              } else {
                ns += params[j] + " ";
              }
            }
          } else if (letter == "Z") {
          }
        }
        console.log("after" + ns);
      }
    }
  }
  chunkPath(path: string): string[] {
    let array = path.split(/([MLZCHVSA])/gi);
    array.shift();
    return array;
  }
}
