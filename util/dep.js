/*
  获得依赖关系链
*/

var Q = require("q");
var cwd_path = process.env.WORKSPACE || process.cwd();
var ngraph = require("neuron-graph");
var node_path = require("path")
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


function getDev(){
    var _ngraph;
    var deferred = Q.defer();

    getCtg().then(function(cortexJson){

        ngraph(cortexJson,{
            cwd: cwd_path,
            built_root: node_path.join(cwd_path, process.env.CORTEX_DEST || 'neurons'),
            dependencyKeys: ['dependencies']
        }, function(err, _,_shrinkwrap){
            // 遍历依赖结果
            var result = [];
            
            function _walk(obj,name,result){
              if(obj.dependencies){
                for(key in obj.dependencies){
                  _walk(obj.dependencies[key],key,result);
                }
              }
              if(name && result.indexOf(name) == -1){
                result.push(name);
              }

              return result;
            }

            // 搜集依赖文件
            _walk(_shrinkwrap,"",result);

            deferred.resolve(result);

        });
    });
    return deferred.promise;
}

module.exports = getDev;
