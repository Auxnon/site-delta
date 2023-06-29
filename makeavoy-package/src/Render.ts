import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { EffectComposer } from "./lib/EffectComposer";
import { ShaderPass } from "./lib/ShaderPass";
import { LuminosityShader } from "./lib/LuminosityShader";
import AppEnvironment from "./types/AppEnvironment";
import AppShell from "./types/AppShell";
import { shimmerMaterial } from "./ShimmerMaterial";

export class Renderer {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  docWidth: number;
  docHeight: number;

  loader: GLTFLoader;

  SHADOW_SIZE = 2048;
  SIZE_DIVIDER = 8;

  composer: EffectComposer;

  specterMaterial;
  lastTime = 0;
  anchors = [];
  overrideWidth = 0;
  overrideHeight = 0;

  canvasToggle = false;
  alphaCanvas: HTMLElement;
  betaCanvas: HTMLElement;
  activeCanvas: HTMLElement;
  activeApp: AppEnvironment | undefined;
  emptyScene: THREE.Scene;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      5000
    );
    this.camera.position.z = 100; //400
    this.camera.position.y = -200; //-800
    this.camera.up = new THREE.Vector3(0, 0, 1);

    this.camera.lookAt(new THREE.Vector3(0, 100, 0));

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.setClearColor(0x000000, 0); //0xb0e9fd,1);//0xb0e9fd,1)

    this.initSceneManagement();
    this.alphaCanvas.appendChild(this.renderer.domElement);
    this.activeCanvas = this.alphaCanvas;

    this.loader = new GLTFLoader();

    this.resize();

    this.composer = new EffectComposer(this.renderer);
    var luminosityPass = new ShaderPass(LuminosityShader);
    this.composer.addPass(luminosityPass);

    // this.initCustomMaterial();
    this.animate(0);
  }

  loadModel(
    modelName: string,
    texture?: boolean,
    color?: THREE.ColorRepresentation,
    basic?: boolean
  ): Promise<THREE.Group> {
    const promise = new Promise<THREE.Group>((resolve, reject) => {
      this.loader.load(
        "./" + modelName, //villager22.gltf',
        (gltf) => {
          // called when the resource is loaded
          //gltf.scene.scale.set(10,10,10);
          let model; //=gltf.scene.children[0];
          gltf.scene.rotation.x = Math.PI / 2;
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              model = child;
              if (!texture && !basic) {
                if (color) {
                  child.material = new THREE.MeshStandardMaterial({
                    color,
                    metalness: 0,
                    roughness: 1.0,
                  });
                } else {
                  child.material = shimmerMaterial;
                }
                child.material.needsUpdate = true;
              } else if (basic) {
                child.material = new THREE.MeshStandardMaterial({
                  vertexColors: true,
                  metalness: 0,
                  roughness: 1.0,
                });
              }
            }
          });
          let m2 = gltf.scene.children[0];
          if (model) {
            var animations = gltf.animations;
            if (animations && animations.length) {
              let mixer = new THREE.AnimationMixer(model);
              for (var i = 0; i < animations.length; i++) {
                var animation = animations[i];
                // There's .3333 seconds junk at the tail of the Monster animation that
                // keeps it from looping cleanly. Clip it at 3 seconds

                //if ( sceneInfo.animationTime ) {
                //    animation.duration = sceneInfo.animationTime;

                // }
                let action = mixer.clipAction(animation);
                //action.setEffectiveTimeScale(200);
                //action.timeScale=0.002;
                action.timeScale = 0.002;
                //if ( state.playAnimation )
                action.play();
              }
            }
            //mainScene.add( gltf.scene.children[0] );
          }
          resolve(gltf.scene);
        },
        (xhr) => {
          // called while loading is progressing
          console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        (error) => {
          // called when loading has errors
          console.error("An error happened", error);
          reject(error);
        }
      );
    });
    return promise;
  }

  resize() {
    this.docWidth = this.overrideWidth || document.documentElement.clientWidth;
    this.docHeight =
      this.overrideHeight || document.documentElement.clientHeight;

    this.camera.aspect = this.docWidth / this.docHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(1); //window.devicePixelRatio / SIZE_DIVIDER);
    this.renderer.setSize(this.docWidth, this.docHeight);
  }

  animate(time: number) {
    let delta = time - this.lastTime;
    delta /= 1000.0;
    this.lastTime = time;
    this.activeApp?.animate(delta);
    this.renderer.render(this.getScene(), this.camera);
    //composer.render();
    requestAnimationFrame((i) => this.animate(i));
  }

  dumpImage(img): HTMLElement {
    let list: HTMLElement[] = Array.from(
      document.querySelectorAll("#afterImage")
    );
    let dom;
    if (!list.length) {
      dom = document.createElement("img");
      dom.id = "afterImage";
    } else {
      dom = list[0];
    }
    dom.setAttribute("src", img);
    return dom;
  }

  bufferPrint(): HTMLElement {
    this.renderer.render(this.getScene(), this.camera);
    return this.dumpImage(this.renderer.domElement.toDataURL());
  }

  roundEdge(x) {
    x = x % Math.PI;
    if (x < 0) x += Math.PI * 2;

    if (x > Math.PI / 4) {
      if (x > (5 * Math.PI) / 4) {
        if (x < (7 * Math.PI) / 4) {
          return (Math.PI * 3) / 2;
        }
      } else {
        if (x > (3 * Math.PI) / 4) {
          return Math.PI;
        } else {
          return Math.PI / 2;
        }
      }
    }
    return 0;
  }

  getRandomColor() {
    let letters = "0123456789ABCDEF";
    let color = Math.random() > 0.5 ? 0x66b136 : 0x76610e;
    return color;
  }

  projectVector(object) {
    var width = this.docWidth,
      height = this.docHeight;
    var widthHalf = width / 2,
      heightHalf = height / 2;

    let vector = object.position.clone();
    vector.z += 30;
    vector.project(this.camera);

    vector.x = vector.x * widthHalf + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;
    return vector;
  }
  getCamera() {
    return this.camera;
  }

  nextCanvas() {
    if (this.canvasToggle) {
      this.canvasToggle = false;
      return this.alphaCanvas;
    } else {
      this.canvasToggle = true;
      return this.betaCanvas;
    }
  }
  currentCanvas() {
    if (!this.canvasToggle) {
      return this.alphaCanvas;
    } else {
      return this.betaCanvas;
    }
  }

  setApp(shell: AppShell, app: AppEnvironment, disableFade?: boolean) {
    const old = this.currentCanvas();
    const canvas = this.nextCanvas();
    if (old == canvas) {
      console.error("same canvas");
    }

    if (!disableFade) {
      setTimeout(() => {
        old.style.opacity = "0";
      }, 1);
      old.style.opacity = "1";
    }
    const afterImage = this.bufferPrint();
    this.activeApp = app;
    canvas.querySelectorAll("*").forEach((e) => e.remove());
    canvas.appendChild(this.renderer.domElement);
    old.appendChild(afterImage);

    canvas.style.opacity = "1";

    shell.open(canvas);
  }

  getScene() {
    return this.activeApp?.scene || this.emptyScene;
  }

  initSceneManagement() {
    this.alphaCanvas = document.createElement("div");
    this.betaCanvas = document.createElement("div");
    this.alphaCanvas.id = "alpha";
    this.betaCanvas.id = "beta";
    this.alphaCanvas.classList.add("canvas-holder");
    this.betaCanvas.classList.add("canvas-holder");
    // this.betaCanvas.style.background = "#fff5";

    this.emptyScene = new THREE.Scene();
    this.activeCanvas = this.alphaCanvas;
  }

  //   initCustomMaterial() {
  //     const frag = `
  //     #define STANDARD
  // #ifdef PHYSICAL
  //     #define REFLECTIVITY
  //     #define CLEARCOAT
  //     #define TRANSPARENCY
  // #endif
  // uniform vec3 diffuse;
  // uniform vec3 emissive;
  // uniform float roughness;
  // uniform float metalness;
  // uniform float opacity;
  // #ifdef TRANSPARENCY
  //     uniform float transparency;
  // #endif
  // #ifdef REFLECTIVITY
  //     uniform float reflectivity;
  // #endif
  // #ifdef CLEARCOAT
  //     uniform float clearcoat;
  //     uniform float clearcoatRoughness;
  // #endif
  // #ifdef USE_SHEEN
  //     uniform vec3 sheen;
  // #endif
  // varying vec3 vViewPosition;
  // #ifndef FLAT_SHADED
  //     varying vec3 vNormal;
  //     #ifdef USE_TANGENT
  //         varying vec3 vTangent;
  //         varying vec3 vBitangent;
  //     #endif
  // #endif
  // #include <common>
  // #include <packing>
  // #include <dithering_pars_fragment>
  // #include <color_pars_fragment>
  // #include <uv_pars_fragment>
  // #include <map_pars_fragment>
  // #include <alphamap_pars_fragment>
  // #include <aomap_pars_fragment>
  // #include <lightmap_pars_fragment>
  // #include <emissivemap_pars_fragment>
  // #include <bsdfs>
  // #include <cube_uv_reflection_fragment>
  // #include <envmap_common_pars_fragment>
  // #include <envmap_physical_pars_fragment>
  // #include <fog_pars_fragment>
  // #include <lights_pars_begin>
  // #include <lights_physical_pars_fragment>
  // #include <shadowmap_pars_fragment>
  // #include <bumpmap_pars_fragment>
  // #include <normalmap_pars_fragment>

  // #include <roughnessmap_pars_fragment>
  // #include <metalnessmap_pars_fragment>
  // #include <logdepthbuf_pars_fragment>
  // #include <clipping_planes_pars_fragment>
  // void main() {
  //     #include <clipping_planes_fragment>
  //     vec4 diffuseColor = vec4( diffuse, opacity );
  //     ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
  //     vec3 totalEmissiveRadiance = emissive;
  //     #include <logdepthbuf_fragment>
  //     #include <map_fragment>
  //     #include <color_fragment>
  //     #include <alphamap_fragment>
  //     #include <alphatest_fragment>
  //     #include <roughnessmap_fragment>
  //     #include <metalnessmap_fragment>
  //     #include <normal_fragment_begin>
  //     #include <normal_fragment_maps>
  //     #include <clearcoat_normal_fragment_begin>
  //     #include <clearcoat_normal_fragment_maps>
  //     #include <emissivemap_fragment>
  //     #include <lights_physical_fragment>
  //     #include <lights_fragment_begin>
  //     #include <lights_fragment_maps>
  //     #include <lights_fragment_end>
  //     #include <aomap_fragment>
  //     vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
  //     #ifdef TRANSPARENCY
  //         diffuseColor.a *= saturate( 1. - transparency + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) );
  //     #endif
  //     float v=clamp(1.-((0.2125 * outgoingLight.r) + (0.7154 * outgoingLight.g) + (0.0721 * outgoingLight.b)),0.1,1.0);
  //     gl_FragColor = vec4(outgoingLight,v);//vec4( outgoingLight,1.-(((0.2125 * outgoingLight.r) + (0.7154 * outgoingLight.g) + (0.0721 * outgoingLight.b)) ) );
  //     #include <tonemapping_fragment>
  //     #include <encodings_fragment>
  //     #include <fog_fragment>
  //     #include <premultiplied_alpha_fragment>
  //     #include <dithering_fragment>
  // }`;

  //     const frag2 = `
  //     uniform vec3 uBaseColor;
  //     uniform float opacity;
  //     uniform vec2 uBaseVertRatio;
  //     #include <common>
  //     varying vec3 vColor;
  // void main() {
  //   vec4 color = vec4(uBaseColor, 1.0);
  //   color *= uBaseVertRatio.x;
  //   color += vec4(vColor, 1.0) * uBaseVertRatio.y;
  //   gl_FragColor = vec4( color.rgb, opacity );
  // }
  // `;

  //     //     const vert2 = `
  //     //     #include <common>
  //     // varying vec2 v_uv;
  //     // void main() {
  //     //    v_uv = uv;
  //     //    gl_Position = projectionMatrix * modelViewMatrix *    vec4(position, 1.0);
  //     // }`;

  //     //gl_FragColor = vec4( outgoingLight, diffuseColor.a );

  //     /*
  //     #ifdef USE_COLOR
  //                 if(vColor==vec3(0,0,1))
  //                     diffuseColor.rgb *= vec3(1,0,0);
  //                 else
  //                     diffuseColor.rgb *= vColor;
  //         #endif*/

  //     //    #include <color_vertex>

  //     const vert = `#define STANDARD
  //     varying vec3 vViewPosition;
  //     #ifndef FLAT_SHADED
  //         varying vec3 vNormal;
  //         #ifdef USE_TANGENT
  //             varying vec3 vTangent;
  //             varying vec3 vBitangent;
  //         #endif
  //     #endif
  //     #include <common>
  //     #include <uv_pars_vertex>
  //     #include <displacementmap_pars_vertex>
  //     #include <color_pars_vertex>
  //     #include <fog_pars_vertex>
  //     #include <morphtarget_pars_vertex>
  //     #include <skinning_pars_vertex>
  //     #include <shadowmap_pars_vertex>
  //     #include <logdepthbuf_pars_vertex>
  //     #include <clipping_planes_pars_vertex>

  //     uniform vec3 shirt;
  //     uniform vec3 wind;

  //     void main() {
  //         #include <uv_vertex>
  //         #include <beginnormal_vertex>
  //         #include <morphnormal_vertex>
  //         #include <skinbase_vertex>
  //         #include <skinnormal_vertex>
  //         #include <defaultnormal_vertex>
  //     #ifndef FLAT_SHADED
  //         vNormal = normalize( transformedNormal );
  //         #ifdef USE_TANGENT
  //             vTangent = normalize( transformedTangent );
  //             vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
  //         #endif
  //     #endif
  //         #include <begin_vertex>
  //         #include <morphtarget_vertex>
  //         #include <skinning_vertex>
  //         #include <displacementmap_vertex>
  //         #include <project_vertex>
  //         #include <logdepthbuf_vertex>
  //         #include <clipping_planes_vertex>
  //         vViewPosition = - mvPosition.xyz;
  //         #include <worldpos_vertex>
  //         #include <shadowmap_vertex>
  //         #include <fog_vertex>
  //     }`;

  //     var uniforms = THREE.UniformsUtils.merge([
  //       THREE.ShaderLib.standard.uniforms,
  //       //{shirt: {value:new THREE.Vector3(0,1,0)},
  //       //wind: {value:new THREE.Vector3(0,0,0)}}
  //     ]);
  //     uniforms.ambientLightColor.value = null;

  //     /*specterMaterial =  new THREE.ShaderMaterial({
  //     uniforms: uniforms,
  //     fragmentShader: fragmentShader(),
  //     vertexShader: vertexShader(),
  //   })**/

  //     // this.specterMaterial = new THREE.ShaderMaterial({
  //     //   uniforms: uniforms,
  //     //   lights: true,
  //     //   vertexColors: true,
  //     //   vertexShader: vert,
  //     //   fragmentShader: frag,

  //     //   //vertexShader: THREE.ShaderChunk.cube_vert,
  //     //   //fragmentShader: THREE.ShaderChunk.cube_frag
  //     // });
  //   }
}

// syncModel(index, obj) {
//   let m = modelsIndexed[index];
//   m.position.x = obj.x;
//   m.position.y = obj.y;
//   m.position.z = obj.z;
// }

// createModel(index) {
//   let model = new THREE.Mesh(cubeGeometry, cubeMaterial);
//   modelsIndexed[index] = model;
//   return model;
// }
/*
function cubit(w,h,d,x,y,z,color,layer){
    let geom = new THREE.BoxBufferGeometry( w, h, d );
    let mat;
    if(color)
        mat=new THREE.MeshStandardMaterial( { color: parseInt(color)} );
    
    let model = new THREE.Mesh( geom,mat);
    model.position.x=x;
    model.position.y=y;
    model.position.z=z;
    model.castShadow=true;
    model.receiveShadow=true;
    if(layer!=undefined && scenes[layer]){
        scenes[layer].add(model);
    }else
       scenes[0].add(model);
    return model;
}*/

// addAnchor(host, bubble) {
//   let anchor = {
//     host: host,
//     bubble: bubble,
//     x: 0,
//     y: 0,
//     offset: 0,
//   };
//   // TODO
//   // this.anchors.forEach((a) => {
//   //   if (a.host == host) {
//   //     a.offset -= 40;
//   //   }
//   // });
//   // this.anchors.push(anchor);
//   console.log(this.anchors.length + " anchors");
//   this.updateAnchor(anchor, this.anchors.length - 1);
//   return anchor;
// }

// updateAnchor(anchor, index) {
//   if (!anchor.bubble) {
//     this.anchors.splice(index, 1);
//     return false;
//   }
//   if (anchor.host) {
//     let vector = this.projectVector(anchor.host);
//     anchor.bubble.style.left = -16 + vector.x + "px";
//     anchor.bubble.style.top = 40 + anchor.offset + vector.y + "px";
//     anchor.x = vector.x;
//     anchor.y = vector.y;
//   }
// }
