import { TangentSpaceNormalMap } from "three/src/constants";
import { Vector2 } from "three/src/math/Vector2";
import { Material } from "three/src/materials/Material";
import { Color } from "three/src/math/Color";
import { ShaderLib, ShaderMaterial } from "three";
import * as THREE from "three";

const vertex = /* glsl */ `
#define STANDARD

varying vec3 vViewPosition;

#ifdef USE_TRANSMISSION

	varying vec3 vWorldPosition;

#endif

#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

#ifdef USE_TRANSMISSION

	vWorldPosition = worldPosition.xyz;

#endif
}
`;

const fragment = /* glsl */ `

#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifdef IOR
	uniform float ior;
#endif

#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;

	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif

	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif

#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif

#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif

#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;

	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif

	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif

#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;

	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif

varying vec3 vViewPosition;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;

	#include <transmission_fragment>

	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

	#ifdef USE_SHEEN

		// Sheen energy compensation approximation calculation can be found at the end of
		// https://drive.google.com/file/d/1T0D1VSyR4AllqIJTQAraEIzjlb5h4FKH/view?usp=sharing
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );

		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;

	#endif

	#ifdef USE_CLEARCOAT

		float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );

		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );

		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;

	#endif
    
	#include <output_fragment>
    float v=clamp(1.-((0.2125 * outgoingLight.r) + (0.7154 * outgoingLight.g) + (0.0721 * outgoingLight.b)),0.1,1.0);
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
   
    gl_FragColor = vec4(outgoingLight,v);
}
`;

const uniforms = THREE.ShaderLib.standard.uniforms;
uniforms.ambientLightColor.value = null;
export const shimmerMaterial = new ShaderMaterial({
  uniforms,
  vertexColors: true,
  lights: true,
  vertexShader: vertex,
  fragmentShader: fragment,
});

// export class ShimmerMaterial extends Material {
//   constructor(parameters) {
//     super();

//     this.isMeshStandardMaterial = true;

//     this.defines = { STANDARD: "" };

//     this.type = "MeshStandardMaterial";

//     this.color = new Color(0xffffff); // diffuse
//     this.roughness = 1.0;
//     this.metalness = 0.0;

//     this.map = null;

//     this.lightMap = null;
//     this.lightMapIntensity = 1.0;

//     this.aoMap = null;
//     this.aoMapIntensity = 1.0;

//     this.emissive = new Color(0x000000);
//     this.emissiveIntensity = 1.0;
//     this.emissiveMap = null;

//     this.bumpMap = null;
//     this.bumpScale = 1;

//     this.normalMap = null;
//     this.normalMapType = TangentSpaceNormalMap;
//     this.normalScale = new Vector2(1, 1);

//     this.displacementMap = null;
//     this.displacementScale = 1;
//     this.displacementBias = 0;

//     this.roughnessMap = null;

//     this.metalnessMap = null;

//     this.alphaMap = null;

//     this.envMap = null;
//     this.envMapIntensity = 1.0;

//     this.wireframe = false;
//     this.wireframeLinewidth = 1;
//     this.wireframeLinecap = "round";
//     this.wireframeLinejoin = "round";

//     this.flatShading = false;

//     this.fog = true;

//     this.setValues(parameters);
//   }

//   copy(source) {
//     super.copy(source);

//     this.defines = { STANDARD: "" };

//     this.color.copy(source.color);
//     this.roughness = source.roughness;
//     this.metalness = source.metalness;

//     this.map = source.map;

//     this.lightMap = source.lightMap;
//     this.lightMapIntensity = source.lightMapIntensity;

//     this.aoMap = source.aoMap;
//     this.aoMapIntensity = source.aoMapIntensity;

//     this.emissive.copy(source.emissive);
//     this.emissiveMap = source.emissiveMap;
//     this.emissiveIntensity = source.emissiveIntensity;

//     this.bumpMap = source.bumpMap;
//     this.bumpScale = source.bumpScale;

//     this.normalMap = source.normalMap;
//     this.normalMapType = source.normalMapType;
//     this.normalScale.copy(source.normalScale);

//     this.displacementMap = source.displacementMap;
//     this.displacementScale = source.displacementScale;
//     this.displacementBias = source.displacementBias;

//     this.roughnessMap = source.roughnessMap;

//     this.metalnessMap = source.metalnessMap;

//     this.alphaMap = source.alphaMap;

//     this.envMap = source.envMap;
//     this.envMapIntensity = source.envMapIntensity;

//     this.wireframe = source.wireframe;
//     this.wireframeLinewidth = source.wireframeLinewidth;
//     this.wireframeLinecap = source.wireframeLinecap;
//     this.wireframeLinejoin = source.wireframeLinejoin;

//     this.flatShading = source.flatShading;

//     this.fog = source.fog;

//     return this;
//   }
// }
