var TAG_ARR = ["static","combo_css","combo_css_src","framework","combo_js_src","combo_js"];
var Q = require("q");
var getCtg = require("./util/ctg");
var getDep = require("./util/dep");
var node_path = require("path");
var relativeMatch_reg = /(?:(?:link|src)=[\'\"]{1}([\.].*?)[\'\"])/g;
var fs = require("fs");
var APPCACHE_EXT = ".appcache";




module.exports = function(content,path,cb){
	// cache数组
	var appcache_arr = [];
	var dirname = node_path.dirname(path);
	var filename = node_path.basename(path,node_path.extname(path))


	function _unique(arr){
		arr.sort();
		var re=[arr[0]];
		for(var i = 1; i < arr.length; i++)
		{
			if( arr[i] !== re[re.length-1])
			{
				re.push(arr[i]);
			}
		}
		return re;
	}

	Q.allSettled([getCtg(),getDep()]).then(function(results){
		var deps = results[1].value;
		var cortexJson = results[0].value;

		TAG_ARR.forEach(function(item){

			var match_stc = '<\\$.*?'+item+'\\(?[\\'+"'"+'\\'+'"]?(.*?)[\\'+"'"+'\\'+'"]?\\)?.*?\\$>'
			var match_reg = new RegExp(match_stc,"g");
			var match;
			/*
				循环遍历分别处理标签
			*/
			while(match = match_reg.exec(content)){
				switch(item){
					case "static":
					case "combo_css_src":
					case "combo_js_src":
						appcache_arr.push(match[0]);
						break;
					/*combo js css 共同处理*/
					case "combo_js":
						var filterDeps = cortexJson.combo && cortexJson.combo.filter || []
						filterDeps.forEach(function(dep){
							appcache_arr.push('<$- static("'+dep+'"") $>');
						})
					case "combo_css":
						var title = /\((.+)\)/.exec(match[0])[1].replace(/\'\"/g,"");
						appcache_arr.push('<$- '+item+'_src('+(title || "")+') $>');
						break;
					case "framework":
						appcache_arr.push('<$- static("neuron/'+(process.env.NEURON_VERSION || "7.2.0")+'/neuron.js") $>');
						break;
				}
			}
			/*
				单个加载js文件
			*/
			if((item == "combo_js_src" || item == "combo_js") && !match_reg.test(content)){
				deps.forEach(function(dep){
					appcache_arr.push('<$- static("'+dep+'") $>');
				})	
			}

		})

		/*自定义添加*/
		appcache_arr = cortexJson.manifest ? appcache_arr.concat(cortexJson.manifest) : appcache_arr;

		/*link src一些相对路径*/
		var match;
		while(match = relativeMatch_reg.exec(content)){
			match[1]&&appcache_arr.push(match[1]);
		}


		/*自动更新*/
		appcache_arr.push("#"+(+ new Date));
		

		/*去重*/
		appcache_arr = _unique(appcache_arr);


		fs.writeFileSync(node_path.join(dirname,filename+APPCACHE_EXT), appcache_arr.join("\n"), {encoding:"utf8"})


		cb();


	})
	
	
}