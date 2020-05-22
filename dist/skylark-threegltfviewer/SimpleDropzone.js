/**
 * skylark-threegltfviewer - A version of threegltfviewer that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-threegltfviewer/
 * @license MIT
 */
define(["skylark-langx-emitter","skylark-langx-async/Deferred","skylark-domx-velm","skylark-domx-files","skylark-domx-plugins","skylark-jszip","./threegltviewer"],function(e,i,s,r,t,l,a){return a.SimpleDropzone=class extends t.Plugin{get klassName(){return"SingleUploader"}get pluginName(){return"lark.singleuploader"}get options(){return{selectors:{picker:".file-picker",dropzone:".file-dropzone",pastezone:".file-pastezone",startUploads:".start-uploads",cancelUploads:".cancel-uploads"}}}constructor(e,i){super(e,i),this._velm=s(this._elm),this._initFileHandlers()}_initFileHandlers(){var e=this,i=this.options.selectors,s=i.dropzone,r=i.pastezone,t=i.picker;s&&this._velm.$(s).dropzone({dropped:function(i){e._addFile(i[0])}}),r&&this._velm.$(r).pastezone({pasted:function(i){e._addFile(i[0])}}),t&&this._velm.$(t).picker({multiple:!0,picked:function(i){e._addFile(i[0])}})}_addFile(e){this._isZip(e)?this._loadZip(e):this.emit("drop",{files:new Map([[e.name,e]])})}destroy(){}_loadZip(e){const s=new Map;l(e).then(r=>{var t=[];r.forEach((e,r)=>{var l=new i;r.async("arraybuffer").then(function(e){r.dir||s.set(r.name,new Blob([e])),l.resolve()}),t.push(l.promise)}),i.all(t).then(()=>{this.emit("drop",{files:s,archive:e})})})}_isZip(e){return"application/zip"===e.type||e.name.match(/\.zip$/)}_fail(e){this.emit("droperror",{message:e})}}});
//# sourceMappingURL=sourcemaps/SimpleDropzone.js.map
