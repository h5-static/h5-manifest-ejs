var fs = require("fs");
var manifest = require("./index");

var content = fs.readFileSync("./template.html","utf8");

manifest(content,"/Users/yangyuanxiang/yyy/h5-static/h5-manifest-ejs/template.html");


