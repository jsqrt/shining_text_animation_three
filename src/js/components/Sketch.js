/* eslint-disable */
import * as T from 'three';
import dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/fontloader';

import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

export default class Sketch {
	constructor(options) {
		this.scene = new T.Scene();
		this.scene1 = new T.Scene();
		// this.scene2 = new T.Scene();
		// this.scene3 = new T.Scene();
		this.group = new T.Group();
		this.group1 = new T.Group();
		// this.group2 = new T.Group();
		// this.group3 = new T.Group();
		this.scene.add(this.group);
		this.scene1.add(this.group1);
		// this.scene2.add(this.group2);
		// this.scene3.add(this.group3);

		this.group.rotation.x = Math.PI/4;
		this.group1.rotation.x = -Math.PI/4;
		// this.group2.rotation.x = Math.PI/4;
		// this.group3.rotation.x = -Math.PI/4;

		this.container = options.dom;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer = new T.WebGLRenderer({
			antialias: true,
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
		this.renderer.setClearColor(0xbae1ff, 1);
		this.renderer.physicallyCorrectLights = true;
		this.renderer.outputEncoding = T.sRGBEncoding;
		this.renderer.setScissorTest(true);

		this.container.appendChild(this.renderer.domElement);

		// this.camera = new T.PerspectiveCamera(
		// 	70,
		// 	window.innerWidth / window.innerHeight,
		// 	0.001,
		// 	1000,
		// );

		const frustumSize = 0.7;
		const aspect = this.width / this.height;
		this.camera = new T.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );

		this.camera.position.set(0, 0, 1);
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.time = 0;

		this.isPlaying = true;

		this.fontSettings = {
			size: 0.075,
			height: 0.075,
			curveSegments: 100,
		};

		this.loadObjects().then(() => {
			this.addObjects();
			this.resize();
			this.render();
			this.setupResize();
			this.addLights();
			// this.settings();
		});
	}

	addLights() {
		const ambientLight = new T.AmbientLight(0xbae1ff, 0.1);
    this.scene.add(ambientLight);
    this.scene1.add(ambientLight.clone());

    // this.scene2.add(ambientLight.clone());
    // this.scene3.add(ambientLight.clone());

    const directionalLight2 = new T.DirectionalLight(0xffdd00, 3);
		directionalLight2.position.set(1, 1, 1);
		this.scene.add(directionalLight2);
		this.scene1.add(directionalLight2.clone());

		// this.scene2.add(directionalLight2.clone());
		// this.scene3.add(directionalLight2.clone());

    const directionalLight3 = new T.DirectionalLight(0xff00ff, 0.25);
		directionalLight3.position.set(-1, -1, 0);
		this.scene.add(directionalLight3);
		this.scene1.add(directionalLight3.clone());

		// this.scene2.add(directionalLight3.clone());
		// this.scene3.add(directionalLight3.clone());
	}

	settings() {
		let that = this;
		this.gui = new dat.GUI();

		const controllers = [
			this.gui.add(this.fontSettings, 'bevelSegments', 0, 10, 1),
			this.gui.add(this.fontSettings, 'size', 0, 10, 1),
			this.gui.add(this.fontSettings, 'height', 0, 10, 1),
			this.gui.add(this.fontSettings, 'curveSegments', 0, 10, 1),
			this.gui.add(this.fontSettings, 'bevelEnabled', false, true),
			this.gui.add(this.fontSettings, 'bevelThickness', 0, 10, 1),
			this.gui.add(this.fontSettings, 'bevelOffset', 0, 10, 1),
			this.gui.add(this.fontSettings, 'bevelSize', 0, 10, 1),
		];

		controllers.map((el) => el.onChange(() => {
			this.removeObjects()
			this.addObjects()
		}));
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this));
	}

	resize() {
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	}

	getMaterial(uniforms) {
		let material = new T.MeshStandardMaterial({
			color: 0xcccccc,
		});

		material.onBeforeCompile = (shader) => {
			shader.uniforms.uMin = uniforms.uMin;
			shader.uniforms.uMax = uniforms.uMax;
			shader.uniforms.time = uniforms.time;
			shader.uniforms.uOffset = uniforms.uOffset;

			shader.fragmentShader = `
			varying float vDiscard;
			` + shader.fragmentShader;

			shader.vertexShader = `
				uniform float uOffset;
				uniform float time;
				uniform vec3 uMin;
				uniform vec3 uMax;
				varying float vDiscard;
				float mapRange(float value, float inMin, float inMax, float outMin, float outMax) {
					return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
				}
				mat4 rotationMatrix(vec3 axis, float angle) {
					axis = normalize(axis);
					float s = sin(angle);
					float c = cos(angle);
					float oc = 1.0 - c;

					return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
											oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
											oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
											0.0,                                0.0,                                0.0,                                1.0);
				}

				vec3 rotate(vec3 v, vec3 axis, float angle) {
					mat4 m = rotationMatrix(axis, angle);
					return (m * vec4(v, 1.0)).xyz;
				}
			` + shader.vertexShader;

			shader.vertexShader = shader.vertexShader.replace(
				`#include <beginnormal_vertex>`,
				`#include <beginnormal_vertex>` + `
					vec3 temp = objectNormal;
					float xx = mapRange(position.x, uMin.x, uMax.x, -1., 1.);

					float theta = (xx + time + uOffset * 0.5)*2.*PI;
					vDiscard = mod(xx + time + mix(-.25, .25, uOffset) + uOffset*0.5, 2.);
					temp = rotate(temp, vec3(0., 0., 1.), theta);
					objectNormal = temp;
				`
			);

			shader.vertexShader = shader.vertexShader.replace(
				`#include <begin_vertex>`,
				`#include <begin_vertex>` + `
					vec3 pos = transformed;
					vec3 dir = vec3(sin(theta), cos(theta), 0.);
					pos = 0.2*dir + vec3(0.,0.,pos.z) + dir*pos.y;

					transformed = pos;
				`
			);


			shader.fragmentShader = shader.fragmentShader.replace(
				`#include <output_fragment>`,
				`#include <output_fragment>` + `
					float dontshow = step(1., vDiscard);
					if(dontshow > 0.5) discard;
				`
			);
		};

		return material;
	}

	loadObjects() {
		const loader = new T.FileLoader();
		const fontLoader = new FontLoader();

		const fragment = new Promise((resolve, reject) => {
			loader.load(
				'./shader/fragment.glsl',
				(data) => {
					this.fragment = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		const vertex = new Promise((resolve, reject) => {
			loader.load(
				'./shader/vertex.glsl',
				(data) => {
					this.vertex = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		// this.font = new Font(droidSans);

		const font = new Promise((resolve, reject) => {
			fontLoader.load(
				'./droid_sans_mono_regular.typeface.json',
				(data) => {
					this.font = data;
					resolve();
				},
				() => {},
				(err) => {
					console.log(err);
					reject();
				},
			);
		});

		return Promise.all([fragment, vertex, font]);
	}

	removeObjects() {
		this.scene.remove(this.textMesh);
	}

	addObjects() {
		let that = this;

		this.uniforms = {
			time: { type: 'f', value: 0 },
			uMin: {
				value: new T.Vector3(0, 0, 0),
			},
			uMax: {
				value: new T.Vector3(0, 0, 0),
			},
			uOffset: { value: 0 },
		};
		this.uniforms1 = {
			time: { type: 'f', value: 0 },
			uMin: {
				value: new T.Vector3(0, 0, 0),
			},
			uMax: {
				value: new T.Vector3(0, 0, 0),
			},
			uOffset: { value: 1 },
		};
		// this.uniforms2 = {
		// 	time: { type: 'f', value: 0 },
		// 	uMin: {
		// 		value: new T.Vector3(0, 0, 0),
		// 	},
		// 	uMax: {
		// 		value: new T.Vector3(0, 0, 0),
		// 	},
		// 	uOffset: { value: 2/3 },
		// };
		// this.uniforms3 = {
		// 	time: { type: 'f', value: 0 },
		// 	uMin: {
		// 		value: new T.Vector3(0, 0, 0),
		// 	},
		// 	uMax: {
		// 		value: new T.Vector3(0, 0, 0),
		// 	},
		// 	uOffset: { value: 1 },
		// };

		this.material = this.getMaterial(this.uniforms);
		this.material1 = this.getMaterial(this.uniforms1);
		// this.material2 = this.getMaterial(this.uniforms2);
		// this.material3 = this.getMaterial(this.uniforms3);


		// this.textGeometry = new T.BoxGeometry(0.5, 0.1, 0.1, 100, 100, 100);

		this.textGeometry = new TextGeometry('GLIVERATEAM', {
			font: this.font,
			...this.fontSettings,
		});

		let clone = this.textGeometry.clone();
		clone.computeBoundingBox();

		this.textGeometry.center();
		this.textGeometry.computeBoundingBox();

		let final1 = this.textGeometry.clone();
		// final1.center();
		final1.computeBoundingBox();

		let clones = [];
		for (let i = 0; i < 4; i++) {
			let clone = final1.clone();
			clone.rotateX(i * Math.PI / 2);
			clone.center();
			clone.translate(final1.boundingBox.max.x * i * 2, 0, 0);
			clones.push(clone);
		}

		let superFinal = mergeBufferGeometries(clones);
		superFinal.center();
		superFinal.computeBoundingBox();


		const { min, max } = superFinal.boundingBox;
		this.uniforms.uMin.value = min;
		this.uniforms.uMax.value = max;
		this.uniforms1.uMin.value = min;
		this.uniforms1.uMax.value = max;
		// this.uniforms2.uMin.value = min;
		// this.uniforms2.uMax.value = max;
		// this.uniforms3.uMin.value = min;
		// this.uniforms3.uMax.value = max;

		this.textMesh = new T.Mesh(superFinal, that.material);
		this.textMesh1 = new T.Mesh(superFinal, that.material1);
		// this.textMesh2 = new T.Mesh(superFinal, that.material2);
		// this.textMesh3 = new T.Mesh(superFinal, that.material3);
		this.group.add(this.textMesh);
		this.group1.add(this.textMesh1);
		// this.group2.add(this.textMesh2);
		// this.group3.add(this.textMesh3);

		const axesHelper = new T.AxesHelper(20);
		this.scene.add(axesHelper);
	}

	stop() {
		this.isPlaying = false;
	}

	play() {
		if (!this.isPlaying) {
			this.render();
			this.isPlaying = true;
		}
	}

	render() {
		if (!this.isPlaying) return;
		this.time += 0.001;
		this.uniforms.time.value = this.time;
		this.uniforms1.time.value = this.time;
		// this.uniforms2.time.value = this.time;
		// this.uniforms3.time.value = this.time;
		window.requestAnimationFrame(this.render.bind(this));

		let semiHeight = this.height/2;
		let semiWidth = this.width/2;

		this.renderer.setScissor(0, 0, semiWidth, this.height);
		this.renderer.render(this.scene, this.camera);
		this.renderer.setScissor(semiWidth, 0, semiWidth, this.height);
		this.renderer.render(this.scene1, this.camera);

		// this.renderer.setScissor(0, 0, semiWidth, semiHeight);
		// this.renderer.render(this.scene, this.camera);

		// this.renderer.setScissor(semiWidth, 0, semiWidth, semiHeight);
		// this.renderer.render(this.scene1, this.camera);

		// this.renderer.setScissor(0, semiHeight, semiWidth, semiHeight);
		// this.renderer.render(this.scene2, this.camera);

		// this.renderer.setScissor(semiWidth, semiHeight, semiWidth, semiHeight);
		// this.renderer.render(this.scene3, this.camera);

		// this.renderer.setScissor(0, 0, this.width, this.height);
		// this.renderer.render(this.scene1, this.camera);
	}
}
