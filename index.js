/*
	需要匹配标签
*/

var Tpl = require("../util/tpl");
var EJS = require("ejs");
var jsTemplate = '<script combo src="<%- value%>"></script>'
var Log = require('log')
  ,log = new Log('info');
var CORTEXT_JSON = "cortex.json";
var path = require("path");
var fs = require("fs");
var ngraph = require('neuron-graph');

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
		log.info(content);
	}
}


module.exports = function(options,cb){
	var comboJsStr = "";
	var isCombo = options.combo || false;
	

	if(isCombo){
		var cortexJson;
		var dep = [];

		tryCatch(function(){
			cortexJson = JSON.parse(stripBOM(fs.readFileSync(path.join(options.cwd,CORTEXT_JSON),"utf8")));;

		},"cortex.json文件解析失败");

		ngraph(cortexJson,{
		    cwd: options.cwd,
		    built_root: path.join(options.cwd, process.env.CORTEX_DEST || 'neurons'),
		    dependencyKeys: ['dependencies']
		}, function(err, graph, shrinkwrap){
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

			cb(function(jsStr){
				_walk(shrinkwrap,"",result).push(jsStr.indexOf("/")!= -1 ? jsStr.replace(/\.[^.]+$/,"")+".js" : jsStr);

				// 过滤lib库
				var jsFilterArray = cortexJson.combo ? (cortexJson.combo.filter || []) : [];
				
				if(jsFilterArray.length)
					result = result.filter(function(item){
						return jsFilterArray.indexOf(item) != -1 ? false : true; 
					});

				return EJS.render(Tpl.combo,{
						value:result.join(",")
					})
			})			
		});
	}else{
		cb(function(jsStr){
			return "";
		});
	}
}


var TAG_ARR = ["static","combo_css","combo_css_src","framework","combo_js_src","combo_js"];

module.exports = function(content,path,cb){
	
	// cache数组
	var appcache_arr = [];


	TAG_ARR.forEach(function(item){
		var match_stc = '<\\$.*?'+item+'\\(?[\'\"]?(.*?)[\'\"]?\\)?.*?\\$>'
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
				case "combo_js":
					appcache_arr.push('<$- combo_js_src('+(match[1] || "")+')');
					break;
				case "combo_css":
					appcache_arr.push('<$- combo_css_src('+(match[1] || "")+')');
					break;
				case "framework":
					appcache_arr.push('<$- static("neuron/'+(process.env.NEURON_VERSION || "7.2.0")+'/neuron.js")');
					break;
			}
		}

		/*
			单个加载js文件
		*/
		if((item == "combo_js_src" || item == "combo_js") && !match_reg.test(test)){

		}


	})
}