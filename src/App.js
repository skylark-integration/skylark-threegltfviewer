define([
    'skylark-threejs-ex/WebGL',
    "./threegltviewer",
    './Viewer',
    './SimpleDropzone'
], function (WebGL, threegltviewer,Viewer, SimpleDropzone) {
    'use strict';
    
    class App {
        constructor(el, location) {
            //const hash = location.hash ? queryString.parse(location.hash) : {};
            const hash = {};
            this.options = {
                kiosk: Boolean(hash.kiosk),
                model: hash.model || '',
                preset: hash.preset || '',
                cameraPosition: hash.cameraPosition ? hash.cameraPosition.split(',').map(Number) : null
            };
            this.el = el;
            this.viewer = null;
            this.viewerEl = null;
            this.spinnerEl = el.querySelector('.spinner');
            this.dropEl = el.querySelector('.dropzone');
            this.inputEl = el.querySelector('#file-input');
            //this.validationCtrl = new Validation(el);
            this.createDropzone();
            this.hideSpinner();
            const options = this.options;
            if (options.kiosk) {
                const headerEl = document.querySelector('header');
                headerEl.style.display = 'none';
            }
            if (options.model) {
                this.view(options.model, '', new Map());
            }
        }

        createDropzone() {
            //const dropCtrl = new SimpleDropzone(this.dropEl, this.inputEl);
            const dropCtrl = new SimpleDropzone(this.el.querySelector('.wrap'),{
                selectors : {
                    dropzone : '.dropzone',
                    picker : '.upload-btn'
                }
            });
            dropCtrl.on('drop', (e,{files}) => this.load(files));
            dropCtrl.on('dropstart', (e) => this.showSpinner());
            dropCtrl.on('droperror', (e) => this.hideSpinner());
        }

        createViewer() {
            this.viewerEl = document.createElement('div');
            this.viewerEl.classList.add('viewer');
            this.dropEl.innerHTML = '';
            this.dropEl.appendChild(this.viewerEl);
            this.viewer = new Viewer(this.viewerEl, this.options);
            return this.viewer;
        }

        load(fileMap) {
            let rootFile;
            let rootPath;
            Array.from(fileMap).forEach(([path, file]) => {
                //if (file.name.match(/\.(gltf|glb|3ds|obj)$/)) {
                if (path.match(/\.(gltf|glb|3ds|obj)$/)) {
                    rootFile = file;
                    //rootPath = path.replace(file.name, '');
                    rootPath = "";
                }
            });
            if (!rootFile) {
                this.onError('No asset(.gltf,.glb,.3ds,.obj) found.');
            }
            this.view(rootFile, rootPath, fileMap);
        }

        view(rootFile, rootPath, fileMap) {
            if (this.viewer)
                this.viewer.clear();
            const viewer = this.viewer || this.createViewer();
            const fileURL = typeof rootFile === 'string' ? rootFile : URL.createObjectURL(rootFile);
            const cleanup = () => {
                this.hideSpinner();
                if (typeof rootFile === 'object')
                    URL.revokeObjectURL(fileURL);
            };
            viewer.load(fileURL, rootPath, fileMap).catch(e => this.onError(e)).then(gltf => {
                //if (!this.options.kiosk) {
                //    this.validationCtrl.validate(fileURL, rootPath, fileMap, gltf);
                //}
                cleanup();
            });
        }

        onError(error) {
            let message = (error || {}).message || error.toString();
            if (message.match(/ProgressEvent/)) {
                message = 'Unable to retrieve this file. Check JS console and browser network tab.';
            } else if (message.match(/Unexpected token/)) {
                message = `Unable to parse file content. Verify that this file is valid. Error: "${ message }"`;
            } else if (error && error.target && error.target instanceof Image) {
                message = 'Missing texture: ' + error.target.src.split('/').pop();
            }
            window.alert(message);
            console.error(error);
        }

        showSpinner() {
            this.spinnerEl.style.display = '';
        }

        hideSpinner() {
            this.spinnerEl.style.display = 'none';
        }
    }

    return threegltviewer.App = App;
});