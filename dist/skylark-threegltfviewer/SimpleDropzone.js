/**
 * skylark-threegltfviewer - A version of threegltfviewer that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-threegltfviewer/
 * @license MIT
 */
define(["skylark-langx-emitter","skylark-langx-async/Deferred","skylark-domx-velm","skylark-domx-files","skylark-domx-plugins","skylark-jszip","./threegltviewer"],function(e,i,s,t,r,a,n){return n.SimpleDropzone=class extends r.Plugin{get klassName(){return"SingleUploader"}get pluginName(){return"lark.singleuploader"}get options(){return{selectors:{picker:".file-picker",dropzone:".file-dropzone",pastezone:".file-pastezone",startUploads:".start-uploads",cancelUploads:".cancel-uploads"}}}constructor(e,i){super(e,i),this._velm=s(this._elm),this._initFileHandlers()}_initFileHandlers(){var e=this,i=this.options.selectors,s=i.dropzone,t=i.pastezone,r=i.picker;s&&this._velm.$(s).dropzone({dropped:function(i){e._addFile(i[0])}}),t&&this._velm.$(t).pastezone({pasted:function(i){e._addFile(i[0])}}),r&&this._velm.$(r).picker({multiple:!0,picked:function(i){e._addFile(i[0])}})}_addFile(e){this._isZip(e)?this._loadZip(e):this.emit("drop",{files:new Map([[e.name,e]])})}destroy(){}_loadZip(e){const s=new Map;a(e).then(t=>{var r=[];t.forEach((e,t)=>{var a=new i;t.async("arraybuffer").then(function(e){t.dir||s.set(t.name,new Blob([e],{type:t.name.match(/\.(png)$/)?"image/png":void 0})),a.resolve()}),r.push(a.promise)}),i.all(r).then(()=>{this.emit("drop",{files:s,archive:e})})})}_isZip(e){return"application/zip"===e.type||e.name.match(/\.zip$/)}_fail(e){this.emit("droperror",{message:e})}}});
//# sourceMappingURL=sourcemaps/SimpleDropzone.js.map
