var SpiceFS = require("./lib");
SpiceFS.Repository.openAt("./", function(err, repo){
    if(!repo)
        console.warn(err);

    repo.openPublicRack(function(err, rack){
        console.log(rack.Spices);
        rack.Spices["now"] = new Date();
        repo.save(function(){
            console.log("saved");
        })
    });
});



/**
 var SpiceRepository = require("./lib/SpiceRepository");
SpiceRepository.openAt("./", function(err, repo){
    if(!repo)
        console.warn(err);

    repo.openPublicRack(function(err, rack){
        console.log(rack.Spices);
        rack.Spices["now"] = new Date();
        repo.save(function(){
            repo.openRacksOf("Wortex17", {}, function(err, protectedRack, privateRack){
                console.log("yay");
            });
        })
    });
});


/**

var SpiceFS = require("./lib");


SpiceFS.Repository.open("./test3", function(err, repo){

    console.log(repo, repo.isFresh);
    console.log(repo.racks.getPublic());
	repo.racks.getPublic().foo = "bar";
    var wortex17 = repo.racks.getPrivate('wortex17', ['abcdefgh']);
    console.log("#", wortex17);
    if(wortex17 != null)
        wortex17.wohoo = "yeeha";
    if(repo && repo.isFresh)
    {
        repo.mkdirpSync();
        repo.save(function(err){
            if(err)
                console.trace("!", err);
            else
                console.log("saved");
        });
    } else {
        repo.removeFromFS(function(err){
            if(err)
                console.warn("Could not remove repo;", err);
            else console.log("Removed");
        });
    }
});

**/
