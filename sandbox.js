
var SpicesDrawer = require("./lib/v1/Spices/Drawer");

var drawerA = new SpicesDrawer();
var drawerB = new SpicesDrawer();

drawerB.Contents["number"] = 500;
drawerB.recalculateLog();

drawerA.Contents["number"] = 404;
drawerA.Contents["string"] = 'older';
drawerA.Contents["object"] = {foo:'bar'};
drawerA.Contents["array"] = ['cookie'];
drawerA.Contents["null"] = null;
drawerA.Contents["object"].ssss = 4;

drawerB.Contents["string"] = 'newer';

drawerA.mergeDrawer(drawerB);


console.log(drawerA.Log);
console.log(drawerB.Log);

/**/