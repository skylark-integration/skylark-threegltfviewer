/**
 * skylark-threegltfviewer - A version of threegltfviewer that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-threegltfviewer/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-threegltfviewer/threegltviewer',[
	"skylark-langx-ns"
],function(skylark){
	return skylark.attach("intg.threegltviewer",{})
});
define('skylark-threejs-ex/WebGL',[],function () {
    'use strict';
    var WEBGL = {
        isWebGLAvailable: function () {
            try {
                var canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        },
        isWebGL2Available: function () {
            try {
                var canvas = document.createElement('canvas');
                return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
            } catch (e) {
                return false;
            }
        },
        getWebGLErrorMessage: function () {
            return this.getErrorMessage(1);
        },
        getWebGL2ErrorMessage: function () {
            return this.getErrorMessage(2);
        },
        getErrorMessage: function (version) {
            var names = {
                1: 'WebGL',
                2: 'WebGL 2'
            };
            var contexts = {
                1: window.WebGLRenderingContext,
                2: window.WebGL2RenderingContext
            };
            var message = 'Your $0 does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">$1</a>';
            var element = document.createElement('div');
            element.id = 'webglmessage';
            element.style.fontFamily = 'monospace';
            element.style.fontSize = '13px';
            element.style.fontWeight = 'normal';
            element.style.textAlign = 'center';
            element.style.background = '#fff';
            element.style.color = '#000';
            element.style.padding = '1.5em';
            element.style.width = '400px';
            element.style.margin = '5em auto 0';
            if (contexts[version]) {
                message = message.replace('$0', 'graphics card');
            } else {
                message = message.replace('$0', 'browser');
            }
            message = message.replace('$1', names[version]);
            element.innerHTML = message;
            return element;
        }
    };
    return WEBGL;
});
define('skylark-threejs-ex/utils/stats',[],function(){

	/**
	 * @author mrdoob / http://mrdoob.com/
	 */

	var Stats = function () {

		var mode = 0;

		var container = document.createElement( 'div' );
		container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
		container.addEventListener( 'click', function ( event ) {

			event.preventDefault();
			showPanel( ++ mode % container.children.length );

		}, false );

		//

		function addPanel( panel ) {

			container.appendChild( panel.dom );
			return panel;

		}

		function showPanel( id ) {

			for ( var i = 0; i < container.children.length; i ++ ) {

				container.children[ i ].style.display = i === id ? 'block' : 'none';

			}

			mode = id;

		}

		//

		var beginTime = ( performance || Date ).now(), prevTime = beginTime, frames = 0;

		var fpsPanel = addPanel( new Stats.Panel( 'FPS', '#0ff', '#002' ) );
		var msPanel = addPanel( new Stats.Panel( 'MS', '#0f0', '#020' ) );

		if ( self.performance && self.performance.memory ) {

			var memPanel = addPanel( new Stats.Panel( 'MB', '#f08', '#201' ) );

		}

		showPanel( 0 );

		return {

			REVISION: 16,

			dom: container,

			addPanel: addPanel,
			showPanel: showPanel,

			begin: function () {

				beginTime = ( performance || Date ).now();

			},

			end: function () {

				frames ++;

				var time = ( performance || Date ).now();

				msPanel.update( time - beginTime, 200 );

				if ( time >= prevTime + 1000 ) {

					fpsPanel.update( ( frames * 1000 ) / ( time - prevTime ), 100 );

					prevTime = time;
					frames = 0;

					if ( memPanel ) {

						var memory = performance.memory;
						memPanel.update( memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576 );

					}

				}

				return time;

			},

			update: function () {

				beginTime = this.end();

			},

			// Backwards Compatibility

			domElement: container,
			setMode: showPanel

		};

	};

	Stats.Panel = function ( name, fg, bg ) {

		var min = Infinity, max = 0, round = Math.round;
		var PR = round( window.devicePixelRatio || 1 );

		var WIDTH = 80 * PR, HEIGHT = 48 * PR,
				TEXT_X = 3 * PR, TEXT_Y = 2 * PR,
				GRAPH_X = 3 * PR, GRAPH_Y = 15 * PR,
				GRAPH_WIDTH = 74 * PR, GRAPH_HEIGHT = 30 * PR;

		var canvas = document.createElement( 'canvas' );
		canvas.width = WIDTH;
		canvas.height = HEIGHT;
		canvas.style.cssText = 'width:80px;height:48px';

		var context = canvas.getContext( '2d' );
		context.font = 'bold ' + ( 9 * PR ) + 'px Helvetica,Arial,sans-serif';
		context.textBaseline = 'top';

		context.fillStyle = bg;
		context.fillRect( 0, 0, WIDTH, HEIGHT );

		context.fillStyle = fg;
		context.fillText( name, TEXT_X, TEXT_Y );
		context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

		context.fillStyle = bg;
		context.globalAlpha = 0.9;
		context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

		return {

			dom: canvas,

			update: function ( value, maxValue ) {

				min = Math.min( min, value );
				max = Math.max( max, value );

				context.fillStyle = bg;
				context.globalAlpha = 1;
				context.fillRect( 0, 0, WIDTH, GRAPH_Y );
				context.fillStyle = fg;
				context.fillText( round( value ) + ' ' + name + ' (' + round( min ) + '-' + round( max ) + ')', TEXT_X, TEXT_Y );

				context.drawImage( canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT );

				context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT );

				context.fillStyle = bg;
				context.globalAlpha = 0.9;
				context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, round( ( 1 - ( value / maxValue ) ) * GRAPH_HEIGHT ) );

			}

		};

	};

	return  Stats;

});

define('skylark-threejs-ex/controls/OrbitControls',[
    "skylark-threejs"
], function (THREE) {
    'use strict';
    var OrbitControls = function (object, domElement) {
        if (domElement === undefined)
            console.warn('THREE.OrbitControls: The second parameter "domElement" is now mandatory.');
        if (domElement === document)
            console.error('THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.');
        this.object = object;
        this.domElement = domElement;
        this.enabled = true;
        this.target = new THREE.Vector3();
        this.minDistance = 0;
        this.maxDistance = Infinity;
        this.minZoom = 0;
        this.maxZoom = Infinity;
        this.minPolarAngle = 0;
        this.maxPolarAngle = Math.PI;
        this.minAzimuthAngle = -Infinity;
        this.maxAzimuthAngle = Infinity;
        this.enableDamping = false;
        this.dampingFactor = 0.05;
        this.enableZoom = true;
        this.zoomSpeed = 1;
        this.enableRotate = true;
        this.rotateSpeed = 1;
        this.enablePan = true;
        this.panSpeed = 1;
        this.screenSpacePanning = false;
        this.keyPanSpeed = 7;
        this.autoRotate = false;
        this.autoRotateSpeed = 2;
        this.enableKeys = true;
        this.keys = {
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            BOTTOM: 40
        };
        this.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
        this.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };
        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.zoom0 = this.object.zoom;
        this.getPolarAngle = function () {
            return spherical.phi;
        };
        this.getAzimuthalAngle = function () {
            return spherical.theta;
        };
        this.saveState = function () {
            scope.target0.copy(scope.target);
            scope.position0.copy(scope.object.position);
            scope.zoom0 = scope.object.zoom;
        };
        this.reset = function () {
            scope.target.copy(scope.target0);
            scope.object.position.copy(scope.position0);
            scope.object.zoom = scope.zoom0;
            scope.object.updateProjectionMatrix();
            scope.dispatchEvent(changeEvent);
            scope.update();
            state = STATE.NONE;
        };
        this.update = function () {
            var offset = new THREE.Vector3();
            var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
            var quatInverse = quat.clone().inverse();
            var lastPosition = new THREE.Vector3();
            var lastQuaternion = new THREE.Quaternion();
            return function update() {
                var position = scope.object.position;
                offset.copy(position).sub(scope.target);
                offset.applyQuaternion(quat);
                spherical.setFromVector3(offset);
                if (scope.autoRotate && state === STATE.NONE) {
                    rotateLeft(getAutoRotationAngle());
                }
                if (scope.enableDamping) {
                    spherical.theta += sphericalDelta.theta * scope.dampingFactor;
                    spherical.phi += sphericalDelta.phi * scope.dampingFactor;
                } else {
                    spherical.theta += sphericalDelta.theta;
                    spherical.phi += sphericalDelta.phi;
                }
                spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta));
                spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
                spherical.makeSafe();
                spherical.radius *= scale;
                spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));
                if (scope.enableDamping === true) {
                    scope.target.addScaledVector(panOffset, scope.dampingFactor);
                } else {
                    scope.target.add(panOffset);
                }
                offset.setFromSpherical(spherical);
                offset.applyQuaternion(quatInverse);
                position.copy(scope.target).add(offset);
                scope.object.lookAt(scope.target);
                if (scope.enableDamping === true) {
                    sphericalDelta.theta *= 1 - scope.dampingFactor;
                    sphericalDelta.phi *= 1 - scope.dampingFactor;
                    panOffset.multiplyScalar(1 - scope.dampingFactor);
                } else {
                    sphericalDelta.set(0, 0, 0);
                    panOffset.set(0, 0, 0);
                }
                scale = 1;
                if (zoomChanged || lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
                    scope.dispatchEvent(changeEvent);
                    lastPosition.copy(scope.object.position);
                    lastQuaternion.copy(scope.object.quaternion);
                    zoomChanged = false;
                    return true;
                }
                return false;
            };
        }();
        this.dispose = function () {
            scope.domElement.removeEventListener('contextmenu', onContextMenu, false);
            scope.domElement.removeEventListener('mousedown', onMouseDown, false);
            scope.domElement.removeEventListener('wheel', onMouseWheel, false);
            scope.domElement.removeEventListener('touchstart', onTouchStart, false);
            scope.domElement.removeEventListener('touchend', onTouchEnd, false);
            scope.domElement.removeEventListener('touchmove', onTouchMove, false);
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);
            scope.domElement.removeEventListener('keydown', onKeyDown, false);
        };
        var scope = this;
        var changeEvent = { type: 'change' };
        var startEvent = { type: 'start' };
        var endEvent = { type: 'end' };
        var STATE = {
            NONE: -1,
            ROTATE: 0,
            DOLLY: 1,
            PAN: 2,
            TOUCH_ROTATE: 3,
            TOUCH_PAN: 4,
            TOUCH_DOLLY_PAN: 5,
            TOUCH_DOLLY_ROTATE: 6
        };
        var state = STATE.NONE;
        var EPS = 0.000001;
        var spherical = new THREE.Spherical();
        var sphericalDelta = new THREE.Spherical();
        var scale = 1;
        var panOffset = new THREE.Vector3();
        var zoomChanged = false;
        var rotateStart = new THREE.Vector2();
        var rotateEnd = new THREE.Vector2();
        var rotateDelta = new THREE.Vector2();
        var panStart = new THREE.Vector2();
        var panEnd = new THREE.Vector2();
        var panDelta = new THREE.Vector2();
        var dollyStart = new THREE.Vector2();
        var dollyEnd = new THREE.Vector2();
        var dollyDelta = new THREE.Vector2();
        function getAutoRotationAngle() {
            return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
        }
        function getZoomScale() {
            return Math.pow(0.95, scope.zoomSpeed);
        }
        function rotateLeft(angle) {
            sphericalDelta.theta -= angle;
        }
        function rotateUp(angle) {
            sphericalDelta.phi -= angle;
        }
        var panLeft = function () {
            var v = new THREE.Vector3();
            return function panLeft(distance, objectMatrix) {
                v.setFromMatrixColumn(objectMatrix, 0);
                v.multiplyScalar(-distance);
                panOffset.add(v);
            };
        }();
        var panUp = function () {
            var v = new THREE.Vector3();
            return function panUp(distance, objectMatrix) {
                if (scope.screenSpacePanning === true) {
                    v.setFromMatrixColumn(objectMatrix, 1);
                } else {
                    v.setFromMatrixColumn(objectMatrix, 0);
                    v.crossVectors(scope.object.up, v);
                }
                v.multiplyScalar(distance);
                panOffset.add(v);
            };
        }();
        var pan = function () {
            var offset = new THREE.Vector3();
            return function pan(deltaX, deltaY) {
                var element = scope.domElement;
                if (scope.object.isPerspectiveCamera) {
                    var position = scope.object.position;
                    offset.copy(position).sub(scope.target);
                    var targetDistance = offset.length();
                    targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180);
                    panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
                    panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
                } else if (scope.object.isOrthographicCamera) {
                    panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
                    panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);
                } else {
                    console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
                    scope.enablePan = false;
                }
            };
        }();
        function dollyOut(dollyScale) {
            if (scope.object.isPerspectiveCamera) {
                scale /= dollyScale;
            } else if (scope.object.isOrthographicCamera) {
                scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
                scope.object.updateProjectionMatrix();
                zoomChanged = true;
            } else {
                console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
                scope.enableZoom = false;
            }
        }
        function dollyIn(dollyScale) {
            if (scope.object.isPerspectiveCamera) {
                scale *= dollyScale;
            } else if (scope.object.isOrthographicCamera) {
                scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
                scope.object.updateProjectionMatrix();
                zoomChanged = true;
            } else {
                console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
                scope.enableZoom = false;
            }
        }
        function handleMouseDownRotate(event) {
            rotateStart.set(event.clientX, event.clientY);
        }
        function handleMouseDownDolly(event) {
            dollyStart.set(event.clientX, event.clientY);
        }
        function handleMouseDownPan(event) {
            panStart.set(event.clientX, event.clientY);
        }
        function handleMouseMoveRotate(event) {
            rotateEnd.set(event.clientX, event.clientY);
            rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
            var element = scope.domElement;
            rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight);
            rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
            rotateStart.copy(rotateEnd);
            scope.update();
        }
        function handleMouseMoveDolly(event) {
            dollyEnd.set(event.clientX, event.clientY);
            dollyDelta.subVectors(dollyEnd, dollyStart);
            if (dollyDelta.y > 0) {
                dollyOut(getZoomScale());
            } else if (dollyDelta.y < 0) {
                dollyIn(getZoomScale());
            }
            dollyStart.copy(dollyEnd);
            scope.update();
        }
        function handleMouseMovePan(event) {
            panEnd.set(event.clientX, event.clientY);
            panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
            pan(panDelta.x, panDelta.y);
            panStart.copy(panEnd);
            scope.update();
        }
        function handleMouseUp() {
        }
        function handleMouseWheel(event) {
            if (event.deltaY < 0) {
                dollyIn(getZoomScale());
            } else if (event.deltaY > 0) {
                dollyOut(getZoomScale());
            }
            scope.update();
        }
        function handleKeyDown(event) {
            var needsUpdate = false;
            switch (event.keyCode) {
            case scope.keys.UP:
                pan(0, scope.keyPanSpeed);
                needsUpdate = true;
                break;
            case scope.keys.BOTTOM:
                pan(0, -scope.keyPanSpeed);
                needsUpdate = true;
                break;
            case scope.keys.LEFT:
                pan(scope.keyPanSpeed, 0);
                needsUpdate = true;
                break;
            case scope.keys.RIGHT:
                pan(-scope.keyPanSpeed, 0);
                needsUpdate = true;
                break;
            }
            if (needsUpdate) {
                event.preventDefault();
                scope.update();
            }
        }
        function handleTouchStartRotate(event) {
            if (event.touches.length == 1) {
                rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
            } else {
                var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                rotateStart.set(x, y);
            }
        }
        function handleTouchStartPan(event) {
            if (event.touches.length == 1) {
                panStart.set(event.touches[0].pageX, event.touches[0].pageY);
            } else {
                var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                panStart.set(x, y);
            }
        }
        function handleTouchStartDolly(event) {
            var dx = event.touches[0].pageX - event.touches[1].pageX;
            var dy = event.touches[0].pageY - event.touches[1].pageY;
            var distance = Math.sqrt(dx * dx + dy * dy);
            dollyStart.set(0, distance);
        }
        function handleTouchStartDollyPan(event) {
            if (scope.enableZoom)
                handleTouchStartDolly(event);
            if (scope.enablePan)
                handleTouchStartPan(event);
        }
        function handleTouchStartDollyRotate(event) {
            if (scope.enableZoom)
                handleTouchStartDolly(event);
            if (scope.enableRotate)
                handleTouchStartRotate(event);
        }
        function handleTouchMoveRotate(event) {
            if (event.touches.length == 1) {
                rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
            } else {
                var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                rotateEnd.set(x, y);
            }
            rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
            var element = scope.domElement;
            rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight);
            rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
            rotateStart.copy(rotateEnd);
        }
        function handleTouchMovePan(event) {
            if (event.touches.length == 1) {
                panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
            } else {
                var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                panEnd.set(x, y);
            }
            panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
            pan(panDelta.x, panDelta.y);
            panStart.copy(panEnd);
        }
        function handleTouchMoveDolly(event) {
            var dx = event.touches[0].pageX - event.touches[1].pageX;
            var dy = event.touches[0].pageY - event.touches[1].pageY;
            var distance = Math.sqrt(dx * dx + dy * dy);
            dollyEnd.set(0, distance);
            dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));
            dollyOut(dollyDelta.y);
            dollyStart.copy(dollyEnd);
        }
        function handleTouchMoveDollyPan(event) {
            if (scope.enableZoom)
                handleTouchMoveDolly(event);
            if (scope.enablePan)
                handleTouchMovePan(event);
        }
        function handleTouchMoveDollyRotate(event) {
            if (scope.enableZoom)
                handleTouchMoveDolly(event);
            if (scope.enableRotate)
                handleTouchMoveRotate(event);
        }
        function handleTouchEnd() {
        }
        function onMouseDown(event) {
            if (scope.enabled === false)
                return;
            event.preventDefault();
            scope.domElement.focus ? scope.domElement.focus() : window.focus();
            var mouseAction;
            switch (event.button) {
            case 0:
                mouseAction = scope.mouseButtons.LEFT;
                break;
            case 1:
                mouseAction = scope.mouseButtons.MIDDLE;
                break;
            case 2:
                mouseAction = scope.mouseButtons.RIGHT;
                break;
            default:
                mouseAction = -1;
            }
            switch (mouseAction) {
            case THREE.MOUSE.DOLLY:
                if (scope.enableZoom === false)
                    return;
                handleMouseDownDolly(event);
                state = STATE.DOLLY;
                break;
            case THREE.MOUSE.ROTATE:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (scope.enablePan === false)
                        return;
                    handleMouseDownPan(event);
                    state = STATE.PAN;
                } else {
                    if (scope.enableRotate === false)
                        return;
                    handleMouseDownRotate(event);
                    state = STATE.ROTATE;
                }
                break;
            case THREE.MOUSE.PAN:
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (scope.enableRotate === false)
                        return;
                    handleMouseDownRotate(event);
                    state = STATE.ROTATE;
                } else {
                    if (scope.enablePan === false)
                        return;
                    handleMouseDownPan(event);
                    state = STATE.PAN;
                }
                break;
            default:
                state = STATE.NONE;
            }
            if (state !== STATE.NONE) {
                document.addEventListener('mousemove', onMouseMove, false);
                document.addEventListener('mouseup', onMouseUp, false);
                scope.dispatchEvent(startEvent);
            }
        }
        function onMouseMove(event) {
            if (scope.enabled === false)
                return;
            event.preventDefault();
            switch (state) {
            case STATE.ROTATE:
                if (scope.enableRotate === false)
                    return;
                handleMouseMoveRotate(event);
                break;
            case STATE.DOLLY:
                if (scope.enableZoom === false)
                    return;
                handleMouseMoveDolly(event);
                break;
            case STATE.PAN:
                if (scope.enablePan === false)
                    return;
                handleMouseMovePan(event);
                break;
            }
        }
        function onMouseUp(event) {
            if (scope.enabled === false)
                return;
            handleMouseUp(event);
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);
            scope.dispatchEvent(endEvent);
            state = STATE.NONE;
        }
        function onMouseWheel(event) {
            if (scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE && state !== STATE.ROTATE)
                return;
            event.preventDefault();
            event.stopPropagation();
            scope.dispatchEvent(startEvent);
            handleMouseWheel(event);
            scope.dispatchEvent(endEvent);
        }
        function onKeyDown(event) {
            if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false)
                return;
            handleKeyDown(event);
        }
        function onTouchStart(event) {
            if (scope.enabled === false)
                return;
            event.preventDefault();
            switch (event.touches.length) {
            case 1:
                switch (scope.touches.ONE) {
                case THREE.TOUCH.ROTATE:
                    if (scope.enableRotate === false)
                        return;
                    handleTouchStartRotate(event);
                    state = STATE.TOUCH_ROTATE;
                    break;
                case THREE.TOUCH.PAN:
                    if (scope.enablePan === false)
                        return;
                    handleTouchStartPan(event);
                    state = STATE.TOUCH_PAN;
                    break;
                default:
                    state = STATE.NONE;
                }
                break;
            case 2:
                switch (scope.touches.TWO) {
                case THREE.TOUCH.DOLLY_PAN:
                    if (scope.enableZoom === false && scope.enablePan === false)
                        return;
                    handleTouchStartDollyPan(event);
                    state = STATE.TOUCH_DOLLY_PAN;
                    break;
                case THREE.TOUCH.DOLLY_ROTATE:
                    if (scope.enableZoom === false && scope.enableRotate === false)
                        return;
                    handleTouchStartDollyRotate(event);
                    state = STATE.TOUCH_DOLLY_ROTATE;
                    break;
                default:
                    state = STATE.NONE;
                }
                break;
            default:
                state = STATE.NONE;
            }
            if (state !== STATE.NONE) {
                scope.dispatchEvent(startEvent);
            }
        }
        function onTouchMove(event) {
            if (scope.enabled === false)
                return;
            event.preventDefault();
            event.stopPropagation();
            switch (state) {
            case STATE.TOUCH_ROTATE:
                if (scope.enableRotate === false)
                    return;
                handleTouchMoveRotate(event);
                scope.update();
                break;
            case STATE.TOUCH_PAN:
                if (scope.enablePan === false)
                    return;
                handleTouchMovePan(event);
                scope.update();
                break;
            case STATE.TOUCH_DOLLY_PAN:
                if (scope.enableZoom === false && scope.enablePan === false)
                    return;
                handleTouchMoveDollyPan(event);
                scope.update();
                break;
            case STATE.TOUCH_DOLLY_ROTATE:
                if (scope.enableZoom === false && scope.enableRotate === false)
                    return;
                handleTouchMoveDollyRotate(event);
                scope.update();
                break;
            default:
                state = STATE.NONE;
            }
        }
        function onTouchEnd(event) {
            if (scope.enabled === false)
                return;
            handleTouchEnd(event);
            scope.dispatchEvent(endEvent);
            state = STATE.NONE;
        }
        function onContextMenu(event) {
            if (scope.enabled === false)
                return;
            event.preventDefault();
        }
        scope.domElement.addEventListener('contextmenu', onContextMenu, false);
        scope.domElement.addEventListener('mousedown', onMouseDown, false);
        scope.domElement.addEventListener('wheel', onMouseWheel, false);
        scope.domElement.addEventListener('touchstart', onTouchStart, false);
        scope.domElement.addEventListener('touchend', onTouchEnd, false);
        scope.domElement.addEventListener('touchmove', onTouchMove, false);
        scope.domElement.addEventListener('keydown', onKeyDown, false);
        if (scope.domElement.tabIndex === -1) {
            scope.domElement.tabIndex = 0;
        }
        this.update();
    };
    OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
    OrbitControls.prototype.constructor = OrbitControls;

    
    return     OrbitControls;
});
define('skylark-threejs-ex/loaders/RGBELoader',[
    "skylark-threejs"
], function (THREE) {
    'use strict';
    var RGBELoader = function (manager) {
        THREE.DataTextureLoader.call(this, manager);
        this.type = THREE.UnsignedByteType;
    };
    RGBELoader.prototype = Object.assign(Object.create(THREE.DataTextureLoader.prototype), {
        constructor: RGBELoader,
        parse: function (buffer) {
            var RGBE_RETURN_FAILURE = -1, rgbe_read_error = 1, rgbe_write_error = 2, rgbe_format_error = 3, rgbe_memory_error = 4, rgbe_error = function (rgbe_error_code, msg) {
                    switch (rgbe_error_code) {
                    case rgbe_read_error:
                        console.error('RGBELoader Read Error: ' + (msg || ''));
                        break;
                    case rgbe_write_error:
                        console.error('RGBELoader Write Error: ' + (msg || ''));
                        break;
                    case rgbe_format_error:
                        console.error('RGBELoader Bad File Format: ' + (msg || ''));
                        break;
                    default:
                    case rgbe_memory_error:
                        console.error('RGBELoader: Error: ' + (msg || ''));
                    }
                    return RGBE_RETURN_FAILURE;
                }, RGBE_VALID_PROGRAMTYPE = 1, RGBE_VALID_FORMAT = 2, RGBE_VALID_DIMENSIONS = 4, NEWLINE = '\n', fgets = function (buffer, lineLimit, consume) {
                    lineLimit = !lineLimit ? 1024 : lineLimit;
                    var p = buffer.pos, i = -1, len = 0, s = '', chunkSize = 128, chunk = String.fromCharCode.apply(null, new Uint16Array(buffer.subarray(p, p + chunkSize)));
                    while (0 > (i = chunk.indexOf(NEWLINE)) && len < lineLimit && p < buffer.byteLength) {
                        s += chunk;
                        len += chunk.length;
                        p += chunkSize;
                        chunk += String.fromCharCode.apply(null, new Uint16Array(buffer.subarray(p, p + chunkSize)));
                    }
                    if (-1 < i) {
                        if (false !== consume)
                            buffer.pos += len + i + 1;
                        return s + chunk.slice(0, i);
                    }
                    return false;
                }, RGBE_ReadHeader = function (buffer) {
                    var line, match, magic_token_re = /^#\?(\S+)$/, gamma_re = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/, exposure_re = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/, format_re = /^\s*FORMAT=(\S+)\s*$/, dimensions_re = /^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/, header = {
                            valid: 0,
                            string: '',
                            comments: '',
                            programtype: 'RGBE',
                            format: '',
                            gamma: 1,
                            exposure: 1,
                            width: 0,
                            height: 0
                        };
                    if (buffer.pos >= buffer.byteLength || !(line = fgets(buffer))) {
                        return rgbe_error(rgbe_read_error, 'no header found');
                    }
                    if (!(match = line.match(magic_token_re))) {
                        return rgbe_error(rgbe_format_error, 'bad initial token');
                    }
                    header.valid |= RGBE_VALID_PROGRAMTYPE;
                    header.programtype = match[1];
                    header.string += line + '\n';
                    while (true) {
                        line = fgets(buffer);
                        if (false === line)
                            break;
                        header.string += line + '\n';
                        if ('#' === line.charAt(0)) {
                            header.comments += line + '\n';
                            continue;
                        }
                        if (match = line.match(gamma_re)) {
                            header.gamma = parseFloat(match[1], 10);
                        }
                        if (match = line.match(exposure_re)) {
                            header.exposure = parseFloat(match[1], 10);
                        }
                        if (match = line.match(format_re)) {
                            header.valid |= RGBE_VALID_FORMAT;
                            header.format = match[1];
                        }
                        if (match = line.match(dimensions_re)) {
                            header.valid |= RGBE_VALID_DIMENSIONS;
                            header.height = parseInt(match[1], 10);
                            header.width = parseInt(match[2], 10);
                        }
                        if (header.valid & RGBE_VALID_FORMAT && header.valid & RGBE_VALID_DIMENSIONS)
                            break;
                    }
                    if (!(header.valid & RGBE_VALID_FORMAT)) {
                        return rgbe_error(rgbe_format_error, 'missing format specifier');
                    }
                    if (!(header.valid & RGBE_VALID_DIMENSIONS)) {
                        return rgbe_error(rgbe_format_error, 'missing image size specifier');
                    }
                    return header;
                }, RGBE_ReadPixels_RLE = function (buffer, w, h) {
                    var data_rgba, offset, pos, count, byteValue, scanline_buffer, ptr, ptr_end, i, l, off, isEncodedRun, scanline_width = w, num_scanlines = h, rgbeStart;
                    if (scanline_width < 8 || scanline_width > 32767 || (2 !== buffer[0] || 2 !== buffer[1] || buffer[2] & 128)) {
                        return new Uint8Array(buffer);
                    }
                    if (scanline_width !== (buffer[2] << 8 | buffer[3])) {
                        return rgbe_error(rgbe_format_error, 'wrong scanline width');
                    }
                    data_rgba = new Uint8Array(4 * w * h);
                    if (!data_rgba || !data_rgba.length) {
                        return rgbe_error(rgbe_memory_error, 'unable to allocate buffer space');
                    }
                    offset = 0;
                    pos = 0;
                    ptr_end = 4 * scanline_width;
                    rgbeStart = new Uint8Array(4);
                    scanline_buffer = new Uint8Array(ptr_end);
                    while (num_scanlines > 0 && pos < buffer.byteLength) {
                        if (pos + 4 > buffer.byteLength) {
                            return rgbe_error(rgbe_read_error);
                        }
                        rgbeStart[0] = buffer[pos++];
                        rgbeStart[1] = buffer[pos++];
                        rgbeStart[2] = buffer[pos++];
                        rgbeStart[3] = buffer[pos++];
                        if (2 != rgbeStart[0] || 2 != rgbeStart[1] || (rgbeStart[2] << 8 | rgbeStart[3]) != scanline_width) {
                            return rgbe_error(rgbe_format_error, 'bad rgbe scanline format');
                        }
                        ptr = 0;
                        while (ptr < ptr_end && pos < buffer.byteLength) {
                            count = buffer[pos++];
                            isEncodedRun = count > 128;
                            if (isEncodedRun)
                                count -= 128;
                            if (0 === count || ptr + count > ptr_end) {
                                return rgbe_error(rgbe_format_error, 'bad scanline data');
                            }
                            if (isEncodedRun) {
                                byteValue = buffer[pos++];
                                for (i = 0; i < count; i++) {
                                    scanline_buffer[ptr++] = byteValue;
                                }
                            } else {
                                scanline_buffer.set(buffer.subarray(pos, pos + count), ptr);
                                ptr += count;
                                pos += count;
                            }
                        }
                        l = scanline_width;
                        for (i = 0; i < l; i++) {
                            off = 0;
                            data_rgba[offset] = scanline_buffer[i + off];
                            off += scanline_width;
                            data_rgba[offset + 1] = scanline_buffer[i + off];
                            off += scanline_width;
                            data_rgba[offset + 2] = scanline_buffer[i + off];
                            off += scanline_width;
                            data_rgba[offset + 3] = scanline_buffer[i + off];
                            offset += 4;
                        }
                        num_scanlines--;
                    }
                    return data_rgba;
                };
            var RGBEByteToRGBFloat = function (sourceArray, sourceOffset, destArray, destOffset) {
                var e = sourceArray[sourceOffset + 3];
                var scale = Math.pow(2, e - 128) / 255;
                destArray[destOffset + 0] = sourceArray[sourceOffset + 0] * scale;
                destArray[destOffset + 1] = sourceArray[sourceOffset + 1] * scale;
                destArray[destOffset + 2] = sourceArray[sourceOffset + 2] * scale;
            };
            var RGBEByteToRGBHalf = function () {
                var floatView = new Float32Array(1);
                var int32View = new Int32Array(floatView.buffer);
                function toHalf(val) {
                    floatView[0] = val;
                    var x = int32View[0];
                    var bits = x >> 16 & 32768;
                    var m = x >> 12 & 2047;
                    var e = x >> 23 & 255;
                    if (e < 103)
                        return bits;
                    if (e > 142) {
                        bits |= 31744;
                        bits |= (e == 255 ? 0 : 1) && x & 8388607;
                        return bits;
                    }
                    if (e < 113) {
                        m |= 2048;
                        bits |= (m >> 114 - e) + (m >> 113 - e & 1);
                        return bits;
                    }
                    bits |= e - 112 << 10 | m >> 1;
                    bits += m & 1;
                    return bits;
                }
                return function (sourceArray, sourceOffset, destArray, destOffset) {
                    var e = sourceArray[sourceOffset + 3];
                    var scale = Math.pow(2, e - 128) / 255;
                    destArray[destOffset + 0] = toHalf(sourceArray[sourceOffset + 0] * scale);
                    destArray[destOffset + 1] = toHalf(sourceArray[sourceOffset + 1] * scale);
                    destArray[destOffset + 2] = toHalf(sourceArray[sourceOffset + 2] * scale);
                };
            }();
            var byteArray = new Uint8Array(buffer);
            byteArray.pos = 0;
            var rgbe_header_info = RGBE_ReadHeader(byteArray);
            if (RGBE_RETURN_FAILURE !== rgbe_header_info) {
                var w = rgbe_header_info.width, h = rgbe_header_info.height, image_rgba_data = RGBE_ReadPixels_RLE(byteArray.subarray(byteArray.pos), w, h);
                if (RGBE_RETURN_FAILURE !== image_rgba_data) {
                    switch (this.type) {
                    case THREE.UnsignedByteType:
                        var data = image_rgba_data;
                        var format = THREE.RGBEFormat;
                        var type = THREE.UnsignedByteType;
                        break;
                    case THREE.FloatType:
                        var numElements = image_rgba_data.length / 4 * 3;
                        var floatArray = new Float32Array(numElements);
                        for (var j = 0; j < numElements; j++) {
                            RGBEByteToRGBFloat(image_rgba_data, j * 4, floatArray, j * 3);
                        }
                        var data = floatArray;
                        var format = THREE.RGBFormat;
                        var type = THREE.FloatType;
                        break;
                    case THREE.HalfFloatType:
                        var numElements = image_rgba_data.length / 4 * 3;
                        var halfArray = new Uint16Array(numElements);
                        for (var j = 0; j < numElements; j++) {
                            RGBEByteToRGBHalf(image_rgba_data, j * 4, halfArray, j * 3);
                        }
                        var data = halfArray;
                        var format = THREE.RGBFormat;
                        var type = THREE.HalfFloatType;
                        break;
                    default:
                        console.error('THREE.RGBELoader: unsupported type: ', this.type);
                        break;
                    }
                    return {
                        width: w,
                        height: h,
                        data: data,
                        header: rgbe_header_info.string,
                        gamma: rgbe_header_info.gamma,
                        exposure: rgbe_header_info.exposure,
                        format: format,
                        type: type
                    };
                }
            }
            return null;
        },
        setDataType: function (value) {
            this.type = value;
            return this;
        },
        load: function (url, onLoad, onProgress, onError) {
            function onLoadCallback(texture, texData) {
                switch (texture.type) {
                case THREE.UnsignedByteType:
                    texture.encoding = THREE.RGBEEncoding;
                    texture.minFilter = THREE.NearestFilter;
                    texture.magFilter = THREE.NearestFilter;
                    texture.generateMipmaps = false;
                    texture.flipY = true;
                    break;
                case THREE.FloatType:
                    texture.encoding = THREE.LinearEncoding;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.generateMipmaps = false;
                    texture.flipY = true;
                    break;
                case THREE.HalfFloatType:
                    texture.encoding = THREE.LinearEncoding;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.generateMipmaps = false;
                    texture.flipY = true;
                    break;
                }
                if (onLoad)
                    onLoad(texture, texData);
            }
            return THREE.DataTextureLoader.prototype.load.call(this, url, onLoadCallback, onProgress, onError);
        }
    });
    return RGBELoader;
});
define('skylark-threegltfviewer/environments',[
  "./threegltviewer"
],function(threegltviewer){
  const environments = [
    {
      id: '',
      name: 'None',
      path: null,
      format: '.hdr'
    },
    {
      id: 'venice-sunset',
      name: 'Venice Sunset',
      path: 'assets/environment/venice_sunset_1k.hdr',
      format: '.hdr'
    },
    {
      id: 'footprint-court',
      name: 'Footprint Court (HDR Labs)',
      path: 'assets/environment/footprint_court_2k.hdr',
      format: '.hdr'
    }
  ];

  return threegltviewer.environments = environments;
});


define('skylark-threegltfviewer/vignettes',[
    'skylark-threejs',
    "./threegltviewer"
], function (THREE,threegltviewer) {
    'use strict';
    const vert = [
                'attribute vec3 position;',
                'uniform mat4 modelViewMatrix;',
                'uniform mat4 projectionMatrix;',
                'varying vec2 vUv;',
                'void main() {',
                '\tgl_Position = vec4(position, 1.0);',
                '\tvUv = vec2(position.x, position.y) * 0.5 + 0.5;',
                '}'
                ].join('\n'),
          frag = [
                'precision mediump float;',
                '#pragma glslify: grain = require(\'glsl-film-grain\')',
                '#pragma glslify: blend = require(\'glsl-blend-soft-light\')',
                '',
                'uniform vec3 color1;',
                'uniform vec3 color2;',
                'uniform float aspect;',
                'uniform vec2 offset;',
                'uniform vec2 scale;',
                'uniform float noiseAlpha;',
                'uniform bool aspectCorrection;',
                'uniform float grainScale;',
                'uniform float grainTime;',
                'uniform vec2 smooth;',
                '',
                'varying vec2 vUv;',
                '',
                'void main() {',
                '\tvec2 q = vec2(vUv - 0.5);',
                '\tif (aspectCorrection) {',
                '\t\tq.x *= aspect;',
                '\t}',
                '\tq /= scale;',
                '\tq -= offset;',
                '\tfloat dst = length(q);',
                '\tdst = smoothstep(smooth.x, smooth.y, dst);',
                '\tvec3 color = mix(color1, color2, dst);',
                '',
                '\tif (noiseAlpha > 0.0 && grainScale > 0.0) {',
                '\t\tfloat gSize = 1.0 / grainScale;',
                '\t\tfloat g = grain(vUv, vec2(gSize * aspect, gSize), grainTime);',
                '\t\tvec3 noiseColor = blend(color, vec3(g));',
                '\t\tgl_FragColor.rgb = mix(color, noiseColor, noiseAlpha);',
                '\t} else {',
                '\t\tgl_FragColor.rgb = color;',
                '\t}',
                '\tgl_FragColor.a = 1.0;',
                '}'
                ].join('\n');

    function createBackground(opt) {
        opt = opt || {};
        var geometry = opt.geometry || new THREE.PlaneGeometry(2, 2, 1);
        var material = new THREE.RawShaderMaterial({
            vertexShader: vert,
            fragmentShader: frag,
            side: THREE.DoubleSide,
            uniforms: {
                aspectCorrection: {
                    type: 'i',
                    value: false
                },
                aspect: {
                    type: 'f',
                    value: 1
                },
                grainScale: {
                    type: 'f',
                    value: 0.005
                },
                grainTime: {
                    type: 'f',
                    value: 0
                },
                noiseAlpha: {
                    type: 'f',
                    value: 0.25
                },
                offset: {
                    type: 'v2',
                    value: new THREE.Vector2(0, 0)
                },
                scale: {
                    type: 'v2',
                    value: new THREE.Vector2(1, 1)
                },
                smooth: {
                    type: 'v2',
                    value: new THREE.Vector2(0, 1)
                },
                color1: {
                    type: 'c',
                    value: new THREE.Color('#fff')
                },
                color2: {
                    type: 'c',
                    value: new THREE.Color('#283844')
                }
            },
            depthTest: false
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        mesh.style = style;
        if (opt)
            mesh.style(opt);
        return mesh;
        function style(opt) {
            opt = opt || {};
            if (Array.isArray(opt.colors)) {
                var colors = opt.colors.map(function (c) {
                    if (typeof c === 'string' || typeof c === 'number') {
                        return new THREE.Color(c);
                    }
                    return c;
                });
                material.uniforms.color1.value.copy(colors[0]);
                material.uniforms.color2.value.copy(colors[1]);
            }
            if (typeof opt.aspect === 'number') {
                material.uniforms.aspect.value = opt.aspect;
            }
            if (typeof opt.grainScale === 'number') {
                material.uniforms.grainScale.value = opt.grainScale;
            }
            if (typeof opt.grainTime === 'number') {
                material.uniforms.grainTime.value = opt.grainTime;
            }
            if (opt.smooth) {
                var smooth = fromArray(opt.smooth, THREE.Vector2);
                material.uniforms.smooth.value.copy(smooth);
            }
            if (opt.offset) {
                var offset = fromArray(opt.offset, THREE.Vector2);
                material.uniforms.offset.value.copy(offset);
            }
            if (typeof opt.noiseAlpha === 'number') {
                material.uniforms.noiseAlpha.value = opt.noiseAlpha;
            }
            if (typeof opt.scale !== 'undefined') {
                var scale = opt.scale;
                if (typeof scale === 'number') {
                    scale = [
                        scale,
                        scale
                    ];
                }
                scale = fromArray(scale, THREE.Vector2);
                material.uniforms.scale.value.copy(scale);
            }
            if (typeof opt.aspectCorrection !== 'undefined') {
                material.uniforms.aspectCorrection.value = Boolean(opt.aspectCorrection);
            }
        }
        function fromArray(array, VectorType) {
            if (Array.isArray(array)) {
                return new VectorType().fromArray(array);
            }
            return array;
        }
    }
    return threegltviewer.vignettes = { createBackground };
});
define('skylark-threegltfviewer/Viewer',[
    'skylark-threejs',
    'skylark-threejs-ex/utils/stats',
    'skylark-threejs-ex/loaders/GLTFLoader',
    'skylark-threejs-ex/loaders/DRACOLoader',
    'skylark-threejs-ex/controls/OrbitControls',
    'skylark-threejs-ex/loaders/RGBELoader',
    'skylark-datgui',
    "./threegltviewer",
    './environments',
    './vignettes'
], function (
  THREE, 
  Stats, 
  GLTFLoader,
  DRACOLoader, 
  OrbitControls, 
  RGBELoader, 
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
                const blobURLs = [];
                loader.load(url, gltf => {
                    const scene = gltf.scene || gltf.scenes[0];
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
            window.content = this.content;
            console.info('[glTF Viewer] THREE.Scene exported as `window.content`.');
            this.printGraph(this.content);
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
                    this.scene.add(this.vignette);
                } else {
                    this.scene.remove(this.vignette);
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
define('skylark-threegltfviewer/SimpleDropzone',[
	"skylark-langx-emitter",
	"skylark-langx-async/Deferred",
	  "skylark-domx-velm",
	 "skylark-domx-files",

	 "skylark-domx-plugins",

	"skylark-jszip",
	"./threegltviewer"
],function(
	Emitter, 
	Deferred, 
	elmx,
	files,
	plugins,
	jszip,
	threegltviewer
) {
	//import ZipLoader from 'zip-loader';

	/**
	 * Watches an element for file drops, parses to create a filemap hierarchy,
	 * and emits the result.
	 */
	class SimpleDropzone extends plugins.Plugin {
		get klassName() {
	    	return "SingleUploader";
    	} 

    	get pluginName(){
      		return "lark.singleuploader";
    	} 

		get options () {
      		return {
	            selectors : {
	              picker   : ".file-picker",
	              dropzone : ".file-dropzone",
	              pastezone: ".file-pastezone",

	              startUploads: '.start-uploads',
	              cancelUploads: '.cancel-uploads',
	            }
	     	}
		}


	  /**
	   * @param  {Element} elm
	   * @param  [options] 
	   */
	  constructor (elm, options) {
	  	super(elm,options);

        this._velm = elmx(this._elm);

	  	this._initFileHandlers();

	}

    _initFileHandlers () {
        var self = this;

        var selectors = this.options.selectors,
        	dzSelector = selectors.dropzone,
        	pzSelector = selectors.pastezone,
        	pkSelector = selectors.picker;

        if (dzSelector) {
			this._velm.$(dzSelector).dropzone({
                dropped : function (files) {
                    self._addFile(files[0]);
                }
			});
        }


        if (pzSelector) {
            this._velm.$(pzSelector).pastezone({
                pasted : function (files) {
                    self._addFile(files[0]);
                }
            });                
        }

        if (pkSelector) {
            this._velm.$(pkSelector).picker({
                multiple: true,
                picked : function (files) {
                    self._addFile(files[0]);
                }
            });                
        }
    }

     _addFile(file) {
	    if (this._isZip(file)) {
	      this._loadZip(file);
	    } else {
	        this.emit('drop', {files: new Map([[file.name, file]])});	    	
	    } 

     }


	  /**
	   * Destroys the instance.
	   */
	  destroy () {
	  }


	  /**
	   * Inflates a File in .ZIP format, creates the fileMap tree, and emits the
	   * result.
	   * @param  {File} file
	   */
	  _loadZip (file) {
	    const pending = [];
	    const fileMap = new Map();

	    const traverse = (node) => {
	      if (node.directory) {
	        node.children.forEach(traverse);
	      } else if (node.name[0] !== '.') {
	        pending.push(new Promise((resolve) => {
	          node.getData(new zip.BlobWriter(), (blob) => {
	            blob.name = node.name;
	            fileMap.set(node.getFullname(), blob);
	            resolve();
	          });
	        }));
	      }
	    };

	    var self = this;

	    jszip(file).then((zip) => {
            var defers = [];

	     	zip.forEach((path,zipEntry) => {
	        	//if (path.match(/\/$/)) return;
	        	//const fileName = path.replace(/^.*[\\\/]/, '');
	        	//fileMap.set(path, new File([archive.files[path].buffer], fileName));
	        	var d = new Deferred();
	          	zipEntry.async("arraybuffer").then(function(data){
	            	if (!zipEntry.dir) {
	             		//fileMap.set(zipEntry.name,new File([data],zipEntry.name,{
	             		//	type : zipEntry.name.match(/\.(png)$/) ? "image/png" : undefined
	             		//}));
	             		fileMap.set(zipEntry.name,new Blob([data],{
	             			type : zipEntry.name.match(/\.(png)$/) ? "image/png" : undefined
	             		}));
	            	} 
             		d.resolve();
	          	});
	          	defers.push(d.promise);
	      	});
	      	Deferred.all(defers).then( () =>{
	      		this.emit('drop', {files: fileMap, archive: file});
	      	});
	    });
	  }

	  /**
	   * @param  {File} file
	   * @return {Boolean}
	   */
	  _isZip (file) {
	    return file.type === 'application/zip' || file.name.match(/\.zip$/);
	  }

	  /**
	   * @param {string} message
	   * @throws
	   */
	  _fail (message) {
	    this.emit('droperror', {message: message});
	  }
	}

	return threegltviewer.SimpleDropzone = SimpleDropzone;

});

 
define('skylark-threegltfviewer/App',[
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
define('skylark-threegltfviewer/main',[
	"./threegltviewer",
	"./App"
],function(threegltviewer){
	return threegltviewer;
});
define('skylark-threegltfviewer', ['skylark-threegltfviewer/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-threegltfviewer.js.map
