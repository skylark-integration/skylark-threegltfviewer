define([
    "skylark-io-diskfs/read",
    "skylark-io-diskfs/download",
    'skylark-threejs',
    'skylark-threejs-ex/utils/stats',

//    'skylark-threejs-ex/loaders/AMFLoader',
//    'skylark-threejs-ex/loaders/ColladaLoader',
    'skylark-threejs-ex/loaders/DRACOLoader',
//    'skylark-threejs-ex/loaders/FBXLoader',
    'skylark-threejs-ex/loaders/GLTFLoader',
 //   'skylark-threejs-ex/loaders/KMZLoader',
//    'skylark-threejs-ex/loaders/MD2Loader',
    'skylark-threejs-ex/loaders/MTLLoader',
    'skylark-threejs-ex/loaders/OBJLoader',
//    'skylark-threejs-ex/loaders/PLYLoader',
//    'skylark-threejs-ex/loaders/STLLoader',
//    'skylark-threejs-ex/loaders/SVGLoader',
    'skylark-threejs-ex/loaders/TDSLoader',
//    'skylark-threejs-ex/loaders/VTKLoader',
//    'skylark-threejs-ex/loaders/VRMLLoader',

    'skylark-threejs-ex/loaders/RGBELoader',


    'skylark-threejs-ex/controls/OrbitControls',
    'skylark-datgui',
    "./threegltviewer",
    './environments',
    './vignettes'
], function (
    readFile,
    download,
  THREE, 
  Stats, 

//    AMFLoader, 
//    ColladaLoader, 
    DRACOLoader, 
//    FBXLoader, 
    GLTFLoader, 
//    KMZLoader, 
//    MD2Loader, 
    MTLLoader, 
    OBJLoader, 
//    PLYLoader, 
//    STLLoader, 
//    SVGLoader, 
    TDSLoader, 
//    VTKLoader, 
//    VRMLLoader, 

  RGBELoader, 


  OrbitControls, 
  datgui, 
  threegltviewer,
  environments, 
  vignettes
) {
    'use strict';
    const DEFAULT_CAMERA = '[default]';
    const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const MAP_NAMES = [
        'map',
        'aoMap',
        'emissiveMap',
        'glossinessMap',
        'metalnessMap',
        'normalMap',
        'roughnessMap',
        'specularMap'
    ];
    const Preset = { ASSET_GENERATOR: 'assetgenerator' };
    THREE.Cache.enabled = true;
    class Viewer {
        constructor(el, options) {
            this.el = el;
            this.options = options;
            this.lights = [];
            this.content = null;
            this.mixer = null;
            this.clips = [];
            this.gui = null;
            this.state = {
                environment: options.preset === Preset.ASSET_GENERATOR ? environments.find(e => e.id === 'footprint-court').name : environments[1].name,
                background: false,
                playbackSpeed: 1,
                actionStates: {},
                camera: DEFAULT_CAMERA,
                wireframe: false,
                skeleton: false,
                grid: false,
                addLights: true,
                exposure: 1,
                textureEncoding: 'sRGB',
                ambientIntensity: 0.3,
                ambientColor: 16777215,
                directIntensity: 0.8 * Math.PI,
                directColor: 16777215,
                bgColor1: '#ffffff',
                bgColor2: '#353535'
            };
            this.prevTime = 0;
            this.stats = new Stats();
            this.stats.dom.height = '48px';
            [].forEach.call(this.stats.dom.children, child => child.style.display = '');
            this.scene = new THREE.Scene();
            const fov = options.preset === Preset.ASSET_GENERATOR ? 0.8 * 180 / Math.PI : 60;
            this.defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
            this.activeCamera = this.defaultCamera;
            this.scene.add(this.defaultCamera);
            this.renderer = window.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.physicallyCorrectLights = true;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.setClearColor(13421772);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(el.clientWidth, el.clientHeight);
            this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
            this.pmremGenerator.compileEquirectangularShader();
            this.controls = new OrbitControls(this.defaultCamera, this.renderer.domElement);
            this.controls.autoRotate = false;
            this.controls.autoRotateSpeed = -10;
            this.controls.screenSpacePanning = true;
            this.vignette = vignettes.createBackground({
                aspect: this.defaultCamera.aspect,
                grainScale: IS_IOS ? 0 : 0.001,
                colors: [
                    this.state.bgColor1,
                    this.state.bgColor2
                ]
            });
            this.vignette.name = 'Vignette';
            this.vignette.renderOrder = -1;
            this.el.appendChild(this.renderer.domElement);
            this.cameraCtrl = null;
            this.cameraFolder = null;
            this.animFolder = null;
            this.animCtrls = [];
            this.morphFolder = null;
            this.morphCtrls = [];
            this.skeletonHelpers = [];
            this.gridHelper = null;
            this.axesHelper = null;
            this.addAxesHelper();
            this.addGUI();
            if (options.kiosk)
                this.gui.close();
            this.animate = this.animate.bind(this);
            requestAnimationFrame(this.animate);
            window.addEventListener('resize', this.resize.bind(this), false);
        }

        animate(time) {
            requestAnimationFrame(this.animate);
            const dt = (time - this.prevTime) / 1000;
            this.controls.update();
            this.stats.update();
            this.mixer && this.mixer.update(dt);
            this.render();
            this.prevTime = time;
        }

        render() {
            this.renderer.render(this.scene, this.activeCamera);
            if (this.state.grid) {
                this.axesCamera.position.copy(this.defaultCamera.position);
                this.axesCamera.lookAt(this.axesScene.position);
                this.axesRenderer.render(this.axesScene, this.axesCamera);
            }
        }

        resize() {
            const {clientHeight, clientWidth} = this.el.parentElement;
            this.defaultCamera.aspect = clientWidth / clientHeight;
            this.defaultCamera.updateProjectionMatrix();
            this.vignette.style({ aspect: this.defaultCamera.aspect });
            this.renderer.setSize(clientWidth, clientHeight);
            this.axesCamera.aspect = this.axesDiv.clientWidth / this.axesDiv.clientHeight;
            this.axesCamera.updateProjectionMatrix();
            this.axesRenderer.setSize(this.axesDiv.clientWidth, this.axesDiv.clientHeight);
        }

        load(url, rootPath, assetMap) {
            const baseURL = THREE.LoaderUtils.extractUrlBase(url);
            return new Promise((resolve, reject) => {
                const manager = new THREE.LoadingManager();
                manager.setURLModifier((url, path) => {
                    const normalizedURL = rootPath + decodeURI(url).replace(baseURL, '').replace(/^(\.?\/)/, '');
                    if (assetMap.has(normalizedURL)) {
                        const blob = assetMap.get(normalizedURL);
                        const blobURL = URL.createObjectURL(blob);
                        blobURLs.push(blobURL);
                        return blobURL;
                    }
                    return (path || '') + url;
                });
                
                const loader = new GLTFLoader(manager);
                loader.setCrossOrigin('anonymous');
                const dracoLoader = new DRACOLoader();
                dracoLoader.setDecoderPath('assets/draco/');
                loader.setDRACOLoader(dracoLoader);
                


            
                //const loader = new OBJLoader(manager);
                const blobURLs = [];

                /*
                var materials;

                assetMap.forEach(function(afile,aname) {
                    if (!materials && aname.match(/\.(mtl)$/)) {
                       materials =  readFile(afile,{
                            asText : true
                        }).then(function(text) {
                            return text;
                        });
                    }
                });
                if (materials) {
                    materials.then(mtl => {
                            var mtlLoader = new MTLLoader(manager);
                            mtlLoader.setPath(rootPath);
                            loader.setMaterials(mtlLoader.parse(mtl,rootPath));


                        loader.load(url, gltf => {
                            const scene = gltf.scene || (gltf.scenes && gltf.scenes[0]) || gltf;
                            const clips = gltf.animations || [];
                            if (!scene) {
                                throw new Error('This model contains no scene, and cannot be viewed here. However,' + ' it may contain individual 3D resources.');
                            }
                            this.setContent(scene, clips);
                            //blobURLs.forEach(URL.revokeObjectURL);
                            resolve(gltf);
                        }, undefined, reject);
                    });
                    return ;
                
                */                
                loader.load(url, gltf => {
                    const scene = gltf.scene || (gltf.scenes && gltf.scenes[0]) || gltf;
                    const clips = gltf.animations || [];
                    if (!scene) {
                        throw new Error('This model contains no scene, and cannot be viewed here. However,' + ' it may contain individual 3D resources.');
                    }
                    this.setContent(scene, clips);
                    blobURLs.forEach(URL.revokeObjectURL);
                    resolve(gltf);
                }, undefined, reject);
            });
        }

        setContent(object, clips) {
            this.clear();
            const box = new THREE.Box3().setFromObject(object);
            const size = box.getSize(new THREE.Vector3()).length();
            const center = box.getCenter(new THREE.Vector3());
            this.controls.reset();
            object.position.x += object.position.x - center.x;
            object.position.y += object.position.y - center.y;
            object.position.z += object.position.z - center.z;
            this.controls.maxDistance = size * 10;
            this.defaultCamera.near = size / 100;
            this.defaultCamera.far = size * 100;
            this.defaultCamera.updateProjectionMatrix();
            if (this.options.cameraPosition) {
                this.defaultCamera.position.fromArray(this.options.cameraPosition);
                this.defaultCamera.lookAt(new THREE.Vector3());
            } else {
                this.defaultCamera.position.copy(center);
                this.defaultCamera.position.x += size / 2;
                this.defaultCamera.position.y += size / 5;
                this.defaultCamera.position.z += size / 2;
                this.defaultCamera.lookAt(center);
            }
            this.setCamera(DEFAULT_CAMERA);
            this.axesCamera.position.copy(this.defaultCamera.position);
            this.axesCamera.lookAt(this.axesScene.position);
            this.axesCamera.near = size / 100;
            this.axesCamera.far = size * 100;
            this.axesCamera.updateProjectionMatrix();
            this.axesCorner.scale.set(size, size, size);
            this.controls.saveState();
            this.scene.add(object);
            this.content = object;
            this.state.addLights = true;
            this.content.traverse(node => {
                if (node.isLight) {
                    this.state.addLights = false;
                } else if (node.isMesh) {
                    node.material.depthWrite = !node.material.transparent;
                }
            });
            this.setClips(clips);  
            this.updateLights();
            this.updateGUI();
            this.updateEnvironment(); 
            this.updateTextureEncoding();
            this.updateDisplay();
            //window.content = this.content; // TODO : edge bug? by  lwf
            //console.info('[glTF Viewer] THREE.Scene exported as `window.content`.');
            //this.printGraph(this.content); // TODO : edge bug? by  lwf
        }

        printGraph(node) {
            console.group(' <' + node.type + '> ' + node.name);
            node.children.forEach(child => this.printGraph(child));
            console.groupEnd();
        }

        setClips(clips) {
            if (this.mixer) {
                this.mixer.stopAllAction();
                this.mixer.uncacheRoot(this.mixer.getRoot());
                this.mixer = null;
            }
            this.clips = clips;
            if (!clips.length)
                return;
            this.mixer = new THREE.AnimationMixer(this.content);
        }

        playAllClips() {
            this.clips.forEach(clip => {
                this.mixer.clipAction(clip).reset().play();
                this.state.actionStates[clip.name] = true;
            });
        }

        setCamera(name) {
            if (name === DEFAULT_CAMERA) {
                this.controls.enabled = true;
                this.activeCamera = this.defaultCamera;
            } else {
                this.controls.enabled = false;
                this.content.traverse(node => {
                    if (node.isCamera && node.name === name) {
                        this.activeCamera = node;
                    }
                });
            }
        }

        updateTextureEncoding() {
            const encoding = this.state.textureEncoding === 'sRGB' ? THREE.sRGBEncoding : THREE.LinearEncoding;
            traverseMaterials(this.content, material => {
                if (material.map)
                    material.map.encoding = encoding;
                if (material.emissiveMap)
                    material.emissiveMap.encoding = encoding;
                if (material.map || material.emissiveMap)
                    material.needsUpdate = true;
            });
        }

        updateLights() {
            const state = this.state;
            const lights = this.lights;
            if (state.addLights && !lights.length) {
                this.addLights();
            } else if (!state.addLights && lights.length) {
                this.removeLights();
            }
            this.renderer.toneMappingExposure = state.exposure;
            if (lights.length === 2) {
                lights[0].intensity = state.ambientIntensity;
                lights[0].color.setHex(state.ambientColor);
                lights[1].intensity = state.directIntensity;
                lights[1].color.setHex(state.directColor);
            }
        }

        addLights() {
            const state = this.state;
            if (this.options.preset === Preset.ASSET_GENERATOR) {
                const hemiLight = new THREE.HemisphereLight();
                hemiLight.name = 'hemi_light';
                this.scene.add(hemiLight);
                this.lights.push(hemiLight);
                return;
            }
            const light1 = new THREE.AmbientLight(state.ambientColor, state.ambientIntensity);
            light1.name = 'ambient_light';
            this.defaultCamera.add(light1);
            const light2 = new THREE.DirectionalLight(state.directColor, state.directIntensity);
            light2.position.set(0.5, 0, 0.866);
            light2.name = 'main_light';
            this.defaultCamera.add(light2);
            this.lights.push(light1, light2);
        }

        removeLights() {
            this.lights.forEach(light => light.parent.remove(light));
            this.lights.length = 0;
        }

        updateEnvironment() {
            const environment = environments.filter(entry => entry.name === this.state.environment)[0];
            this.getCubeMapTexture(environment).then(({envMap}) => {
                if ((!envMap || !this.state.background) && this.activeCamera === this.defaultCamera) {
                    //this.scene.add(this.vignette); // TODO : edge bug? by  lwf
                } else {
                    //this.scene.remove(this.vignette);
                }
                this.scene.environment = envMap;
                this.scene.background = this.state.background ? envMap : null;
            });
        }

        getCubeMapTexture(environment) {
            const {path} = environment;
            if (!path)
                return Promise.resolve({ envMap: null });
            return new Promise((resolve, reject) => {
                new RGBELoader().setDataType(THREE.UnsignedByteType).load(path, texture => {
                    const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
                    this.pmremGenerator.dispose();
                    resolve({ envMap });
                }, undefined, reject);
            });
        }

        updateDisplay() {
            if (this.skeletonHelpers.length) {
                this.skeletonHelpers.forEach(helper => this.scene.remove(helper));
            }
            traverseMaterials(this.content, material => {
                material.wireframe = this.state.wireframe;
            });
            this.content.traverse(node => {
                if (node.isMesh && node.skeleton && this.state.skeleton) {
                    const helper = new THREE.SkeletonHelper(node.skeleton.bones[0].parent);
                    helper.material.linewidth = 3;
                    this.scene.add(helper);
                    this.skeletonHelpers.push(helper);
                }
            });
            if (this.state.grid !== Boolean(this.gridHelper)) {
                if (this.state.grid) {
                    this.gridHelper = new THREE.GridHelper();
                    this.axesHelper = new THREE.AxesHelper();
                    this.axesHelper.renderOrder = 999;
                    this.axesHelper.onBeforeRender = renderer => renderer.clearDepth();
                    this.scene.add(this.gridHelper);
                    this.scene.add(this.axesHelper);
                } else {
                    this.scene.remove(this.gridHelper);
                    this.scene.remove(this.axesHelper);
                    this.gridHelper = null;
                    this.axesHelper = null;
                    this.axesRenderer.clear();
                }
            }
        }

        updateBackground() {
            this.vignette.style({
                colors: [
                    this.state.bgColor1,
                    this.state.bgColor2
                ]
            });
        }

        addAxesHelper() {
            this.axesDiv = document.createElement('div');
            this.el.appendChild(this.axesDiv);
            this.axesDiv.classList.add('axes');
            const {clientWidth, clientHeight} = this.axesDiv;
            this.axesScene = new THREE.Scene();
            this.axesCamera = new THREE.PerspectiveCamera(50, clientWidth / clientHeight, 0.1, 10);
            this.axesScene.add(this.axesCamera);
            this.axesRenderer = new THREE.WebGLRenderer({ alpha: true });
            this.axesRenderer.setPixelRatio(window.devicePixelRatio);
            this.axesRenderer.setSize(this.axesDiv.clientWidth, this.axesDiv.clientHeight);
            this.axesCamera.up = this.defaultCamera.up;
            this.axesCorner = new THREE.AxesHelper(5);
            this.axesScene.add(this.axesCorner);
            this.axesDiv.appendChild(this.axesRenderer.domElement);
        }

        addGUI() {
            const gui = this.gui = new datgui.GUI({
                autoPlace: false,
                width: 260,
                hideable: true
            });
            const dispFolder = gui.addFolder('Display');
            const envBackgroundCtrl = dispFolder.add(this.state, 'background');
            envBackgroundCtrl.onChange(() => this.updateEnvironment());
            const wireframeCtrl = dispFolder.add(this.state, 'wireframe');
            wireframeCtrl.onChange(() => this.updateDisplay());
            const skeletonCtrl = dispFolder.add(this.state, 'skeleton');
            skeletonCtrl.onChange(() => this.updateDisplay());
            const gridCtrl = dispFolder.add(this.state, 'grid');
            gridCtrl.onChange(() => this.updateDisplay());
            dispFolder.add(this.controls, 'autoRotate');
            dispFolder.add(this.controls, 'screenSpacePanning');
            const bgColor1Ctrl = dispFolder.addColor(this.state, 'bgColor1');
            const bgColor2Ctrl = dispFolder.addColor(this.state, 'bgColor2');
            bgColor1Ctrl.onChange(() => this.updateBackground());
            bgColor2Ctrl.onChange(() => this.updateBackground());
            const lightFolder = gui.addFolder('Lighting');
            const encodingCtrl = lightFolder.add(this.state, 'textureEncoding', [
                'sRGB',
                'Linear'
            ]);
            encodingCtrl.onChange(() => this.updateTextureEncoding());
            lightFolder.add(this.renderer, 'outputEncoding', {
                sRGB: THREE.sRGBEncoding,
                Linear: THREE.LinearEncoding
            }).onChange(() => {
                this.renderer.outputEncoding = Number(this.renderer.outputEncoding);
                traverseMaterials(this.content, material => {
                    material.needsUpdate = true;
                });
            });
            const envMapCtrl = lightFolder.add(this.state, 'environment', environments.map(env => env.name));
            envMapCtrl.onChange(() => this.updateEnvironment());
            [
                lightFolder.add(this.state, 'exposure', 0, 2),
                lightFolder.add(this.state, 'addLights').listen(),
                lightFolder.add(this.state, 'ambientIntensity', 0, 2),
                lightFolder.addColor(this.state, 'ambientColor'),
                lightFolder.add(this.state, 'directIntensity', 0, 4),
                lightFolder.addColor(this.state, 'directColor')
            ].forEach(ctrl => ctrl.onChange(() => this.updateLights()));
            this.animFolder = gui.addFolder('Animation');
            this.animFolder.domElement.style.display = 'none';
            const playbackSpeedCtrl = this.animFolder.add(this.state, 'playbackSpeed', 0, 1);
            playbackSpeedCtrl.onChange(speed => {
                if (this.mixer)
                    this.mixer.timeScale = speed;
            });
            this.animFolder.add({ playAll: () => this.playAllClips() }, 'playAll');
            this.morphFolder = gui.addFolder('Morph Targets');
            this.morphFolder.domElement.style.display = 'none';
            this.cameraFolder = gui.addFolder('Cameras');
            this.cameraFolder.domElement.style.display = 'none';
            const perfFolder = gui.addFolder('Performance');
            const perfLi = document.createElement('li');
            this.stats.dom.style.position = 'static';
            perfLi.appendChild(this.stats.dom);
            perfLi.classList.add('gui-stats');
            perfFolder.__ul.appendChild(perfLi);
            const guiWrap = document.createElement('div');
            this.el.appendChild(guiWrap);
            guiWrap.classList.add('gui-wrap');
            guiWrap.appendChild(gui.domElement);
            gui.open();
        }

        updateGUI() {
            this.cameraFolder.domElement.style.display = 'none';
            this.morphCtrls.forEach(ctrl => ctrl.remove());
            this.morphCtrls.length = 0;
            this.morphFolder.domElement.style.display = 'none';
            this.animCtrls.forEach(ctrl => ctrl.remove());
            this.animCtrls.length = 0;
            this.animFolder.domElement.style.display = 'none';
            const cameraNames = [];
            const morphMeshes = [];
            this.content.traverse(node => {
                if (node.isMesh && node.morphTargetInfluences) {
                    morphMeshes.push(node);
                }
                if (node.isCamera) {
                    node.name = node.name || `VIEWER__camera_${ cameraNames.length + 1 }`;
                    cameraNames.push(node.name);
                }
            });
            if (cameraNames.length) {
                this.cameraFolder.domElement.style.display = '';
                if (this.cameraCtrl)
                    this.cameraCtrl.remove();
                const cameraOptions = [DEFAULT_CAMERA].concat(cameraNames);
                this.cameraCtrl = this.cameraFolder.add(this.state, 'camera', cameraOptions);
                this.cameraCtrl.onChange(name => this.setCamera(name));
            }
            if (morphMeshes.length) {
                this.morphFolder.domElement.style.display = '';
                morphMeshes.forEach(mesh => {
                    if (mesh.morphTargetInfluences.length) {
                        const nameCtrl = this.morphFolder.add({ name: mesh.name || 'Untitled' }, 'name');
                        this.morphCtrls.push(nameCtrl);
                    }
                    for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                        const ctrl = this.morphFolder.add(mesh.morphTargetInfluences, i, 0, 1, 0.01).listen();
                        Object.keys(mesh.morphTargetDictionary).forEach(key => {
                            if (key && mesh.morphTargetDictionary[key] === i)
                                ctrl.name(key);
                        });
                        this.morphCtrls.push(ctrl);
                    }
                });
            }
            if (this.clips.length) {
                this.animFolder.domElement.style.display = '';
                const actionStates = this.state.actionStates = {};
                this.clips.forEach((clip, clipIndex) => {
                    let action;
                    if (clipIndex === 0) {
                        actionStates[clip.name] = true;
                        action = this.mixer.clipAction(clip);
                        action.play();
                    } else {
                        actionStates[clip.name] = false;
                    }
                    const ctrl = this.animFolder.add(actionStates, clip.name).listen();
                    ctrl.onChange(playAnimation => {
                        action = action || this.mixer.clipAction(clip);
                        action.setEffectiveTimeScale(1);
                        playAnimation ? action.play() : action.stop();
                    });
                    this.animCtrls.push(ctrl);
                });
            }
        }
        clear() {
            if (!this.content)
                return;
            this.scene.remove(this.content);
            this.content.traverse(node => {
                if (!node.isMesh)
                    return;
                node.geometry.dispose();
            });
            traverseMaterials(this.content, material => {
                MAP_NAMES.forEach(map => {
                    if (material[map])
                        material[map].dispose();
                });
            });
        }
    } ;

    function traverseMaterials(object, callback) {
        object.traverse(node => {
            if (!node.isMesh)
                return;
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach(callback);
        });
    }

    return threegltviewer.Viewer = Viewer;
});