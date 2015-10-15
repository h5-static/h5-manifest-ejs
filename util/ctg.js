var cortex_json = require('read-cortex-json');
var Q = require("q");
var cwd_path = process.env.WORKSPACE || process.cwd();

function getCtg(){
   	var deferred = Q.defer();
	cortex_json.read(cwd_path,function(a,json){
		deferred.resolve(json);
	})
	return deferred.promise;
}

module.exports = getCtg;