var SpiceFS = require("./lib");

SpiceFS.Repository.open("./test3", function(err, repo){
    console.log(repo, repo.isFresh);
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
        });
    }
});
