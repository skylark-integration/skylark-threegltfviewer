define([
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

 