var
    fs = require('fs'),
    path = require('path')
    ;
var
    Constants = require('./Constants'),
    Storage = require('./Storage'),
    Resource = require('./Resource'),
    UniqueID = require('./UniqueID'),
    Spicerack = require('./Spicerack')
    ;

/**
 * Class that provides information about an repository.
 * A repository is a unique file which contaisn a unique id to
 * identify an resource
 * @constructor
 */
function Repository(data)
{
    if(data)
    {
        this.ID = data.ID;
    } else {
        this.ID = UniqueID.generateUUID();
    }
}
Repository.prototype.ID = null;
Repository.prototype.toBSON = function()
{
    return {
        ID: this.ID
    }
};

/**
 *
 * @callback Repository~getCallback
 * @param err
 * @param {Repository|null} repository
 */

/**
 * @param {string} resourcePath
 * @param {Repository~getCallback} callback
 */
Repository.getAtResource = function(resourcePath, callback)
{
    Storage.loadObjectFrom(path.join(resourcePath, Constants.SPICES_DIR, Constants.REPOSITORY_FILE),
        function(err, data){
            if(err)
            {
                switch(err.code)
                {
                    case 'ENOENT':
                        Resource.exists(resourcePath, function(err2, exists){
                            if(exists)
                            {
                                callback(null, null);
                            } else {
                                callback(err2, null);
                            }
                        });
                        break;
                    default:
                        callback(err, null);
                }
            } else {
                var repo = new Repository(data);
                callback(null, repo);
            }
        }
    );
};

/**
 * @param {string} resourcePath
 * @param {Repository~getCallback} callback
 */
Repository.createAtResource = function(resourcePath, callback)
{
    Repository.getAtResource(resourcePath, function(err, repo){
        if(err)
            callback(err);
        else
        {
            if(repo)
            {
                callback(null, repo);
            } else {
                var repository = new Repository();
                fs.mkdir(path.join(resourcePath, Constants.SPICES_DIR), function(){
                    Storage.storeObjectAs(repository, path.join(resourcePath, Constants.SPICES_DIR, Constants.REPOSITORY_FILE),
                        function(err) {
                            callback(err, repository);
                        }
                    );
                });
            }
        }
    });
};

/**
 * Cleans up the repository,
 * merges foreign racks into native racks and removes the foreign racks in that process
 * The Directory is scanned once, then for each foreign rack, it is loaded repeatedly until the modification date before and after the loading operation
 * is the same (it has not been changed), then it is deleted. The the next cached entry form the list is tried.
 * If any foreign rack of the list cannot be loaded, it will be ignored
 * After everything is complete, the repo will be returned in the callback
 * @param {string} resourcePath
 * @param callback
 */
Repository.cleanupAtResource = function(resourcePath, callback)
{
    Repository.getAtResource(resourcePath, function(err, repo){
        if(err)
            callback(err, repo);
        else
        {
            Spicerack.listSpiceRacks(resourcePath, function(err, native, foreign){
                console.log(err, native, foreign);
                if(err)
                    callback(err, repo);
                else {
                    //@todo
                }
            });
        }
    });
};


module.exports = Repository;