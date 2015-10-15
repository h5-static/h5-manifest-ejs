/*
  获得依赖关系链
*/

var Q = require("q");
var fs = require("fs");
var cwd_path = process.env.WORKSPACE || process.cwd();
var ngraph = require("neuron-graph");
var node_path = require("path")
var pkg = require("neuron-pkg");
var semver = require("semver");
var ENV = require("./env");
var getCtg = require("./ctg");


function stripBOM(content) {
  // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
  // because the buffer-to-string conversion in `fs.readFileSync()`
  // translates it to FEFF, the UTF-16 BOM.
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

function tryCatch(cb,content){
	try{
		cb()
	}catch(e){
		die(content);
	}
}


function getShrinkWrap(){
    var _ngraph;
    var deferred = Q.defer();

    getCtg().then(function(cortexJson){

        ngraph(cortexJson,{
            cwd: cwd_path,
            built_root: node_path.join(cwd_path, process.env.CORTEX_DEST || 'neurons'),
            dependencyKeys: ['dependencies']
        }, function(err, _shrinkwrap){
                        
            deferred.resolve(_ngraph = {
                graph:_graph,
                shrinkwrap:_shrinkwrap
            });

        });
    });
    return deferred.promise;
}

module.exports = getShrinkWrap;
