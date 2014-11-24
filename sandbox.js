var lib = require("./lib/v01");
var fs = require("fs");

var Repository = require('./lib/v01/Repository');
var Spicerack = require('./lib/v01/Spicerack');


//var dir = "\\\\tplinklogin.net\\volume9\\";
var dir = "testdir";


Repository.cleanupAtResource(dir, function(err, repo){

});

/*
Repository.createAtResource(dir, function(err, repo){
    Spicerack.getAtResource(dir, ["public", "public"], function(errors, racks, repository){

        var rack = racks["public"];
        var test = rack.getSpice("test");

        console.log(test.Contents);
        test.Contents.Alpha = "0mega" + Date.now();
        console.log(test.Contents);

        rack.storeSpice(test);


        rack.storeAtResource(dir, function(err, rack, repo){
            console.log(err, rack, repo);
        });
    });
});

/**
Repository.createAtResource("testdir", function(err, repo){
    console.log(err, repo);
});

/**/