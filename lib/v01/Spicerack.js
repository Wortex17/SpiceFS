var
    fs = require('fs'),
    path = require('path')
    ;
var
    Constants = require('./Constants'),
    Storage = require('./Storage'),
    DeviceID = require('./DeviceID'),
    Repository = require('./Repository'),
    Spice = require('./Spice')
    ;

/**
 * A Spicerack represents a collection of spices.
 * A Spicerack can be merged with other spiceracks by merging the spices in it.
 * A Spicerack can be obtained and saved as a whole. Storing a Spicerack will never delete any spices,
 * as the Spicerack is considered to be an update of its present spices.
 * @constructor
 */
function Spicerack(data)
{
    this.Spices = {};
    var that = this;
    if(data)
    {
        for(var spiceName in data.Spices)
        {
            if(data.Spices.hasOwnProperty(spiceName))
            {
                that.Spices[spiceName] = new Spice(data.Spices[spiceName]);
            }
        }

        this.Name = data.Name;
    }
}
/**
 *
 * @type {{Spice}}
 */
Spicerack.prototype.Spices = null;
/**
 * @type {string}
 */
Spicerack.prototype.Name = "public";


Spicerack.prototype.toBSON = function()
{
    return {
        Name: this.Name,
        Spices: this.Spices
    }
};

/**
 * Stores a spice in this rack. If there is already a spice with this name, they will
 * be merged in the this direction storedSpice <= givenSpice
 * @param {Spice} spice
 */
Spicerack.prototype.storeSpice = function(spice)
{
    var filteredSpices = {};

    if(this.Spices[spice.Name])
    {
        this.Spices[spice.Name].mergeChangesFrom(spice);
    } else {
        this.Spices[spice.Name] = spice;
    }
};

/**
 *
 * @param spicename
 * @returns {Spice}
 */
Spicerack.prototype.getSpice = function(spicename)
{
    if(!this.Spices[spicename])
    {
        this.Spices[spicename] = new Spice();
        this.Spices[spicename].Name = spicename;
    }

    return this.Spices[spicename];
};

Spicerack.prototype.mergeChangesFrom = function(otherRack)
{
    var that = this;

    //Get all spicenames of both racks first
    var spicesnamesUNQ = {};
    for(var spicenameThis in this.Spices)
    {
        if(this.Spices.hasOwnProperty(spicenameThis))
        {
            spicesnamesUNQ[spicenameThis] = true;
        }
    }
    for(var spicenameOther in otherRack.Spices)
    {
        if(otherRack.Spices.hasOwnProperty(spicenameOther))
        {
            spicesnamesUNQ[spicenameOther] = true;
        }
    }
    var spicenames = Object.keys(spicesnamesUNQ);


    //Now merge all these spices from other => this
    spicenames.forEach(function(name){
        if(that.Spices[name])
        {
            if(otherRack.Spices[name])
            {
                that.Spices[name].mergeChangesFrom(otherRack.Spices[name]);
            }
        } else {
            that.Spices[name] = otherRack.Spices[name];
        }
    });

};

/**
 * Stores the rack at the given resourcePath, if there is a repository.
 * If there isn't, nothing will be stored
 * If there is, and there already is a rack, the rack will be loaded, merged with this one and then stored again.
 * @param {string} resourcePath
 * @param callback
 */
Spicerack.prototype.storeAtResource = function(resourcePath, callback)
{
    var that = this;

    var repo = null;
    Repository.getAtResource(resourcePath, function(err, repository){
        if(err || !repository)
        {
            callback(err, null, repository);
        } else {
            repo = repository;
            tryToStoreRack();
        }
    });

    var filename = path.join(resourcePath, Constants.SPICES_DIR, getRackFileName(that.Name));
    var lastModifiedTime = 0;
    function tryToStoreRack()
    {
        //Stat the targetfile first
        fs.stat(filename, function(err, stat) {

            //Check if its our first approach. If not, check if has been modified since we merged last time
            if( stat && lastModifiedTime < stat.mtime.getTime() )
            {
                lastModifiedTime = stat.mtime;
                Spicerack.getAtResource(resourcePath, that.Name, function(err, racks){
                    if(err || !racks)
                    {
                        callback(err, that, repo);
                    }
                    //There is a rack, so lets merge
                    var rack = racks[that.Name];
                    if(rack)
                        that.mergeChangesFrom(rack);
                    //Now lets try again, maybe there were changes by now
                    setImmediate(tryToStoreRack);
                });
            } else {
                //Either there was no file (and thus no stat) or we merged with the latest modification
                //Note that a race condition can still occur, but meh >.<
                Storage.storeObjectAs(that, filename, function(err){
                    callback(err, that, repo);
                });
            }

        });
    }
};

Spicerack.listSpiceRacks = function(resourcePath, callback)
{
    fs.readdir(path.join(resourcePath, Constants.SPICES_DIR), function(err, directoryItems){
        if(err)
        {
            callback(err, null, null);
        } else {
            var foreignRacks = [];
            var nativeRacks = [];

            directoryItems.forEach(function(item){
                var parts = item.split('.');
                parts.reverse();
                if(parts.length > 2 && parts[0] == 'rack')
                {
                    if(parts[1] == DeviceID.ID)
                    {
                        nativeRacks.push(item);
                    } else {
                        foreignRacks.push(item);
                    }
                }
            });

            callback(null, nativeRacks, foreignRacks);
        }
    });
};

/**
 * Loads one or more racks, if there is a rpeository at the given resource.
 * If there isn't, the returned array of racks will be null
 * @param {string} resourcePath
 * @param {string|[string]} racknames - one or more racknames for the racks to be loaded
 * @param callback
 */
Spicerack.getAtResource = function(resourcePath, racknames, callback)
{
    //Ensure its an array
    racknames = [].concat( racknames );

    var errors = {};
    var results = {};
    var asyncBlock = racknames.length;
    racknames.forEach(function(rackname, index){
        racknames[index] = rackname.toLowerCase();
        results[rackname.toLowerCase()] = null;
    });
    var repo = null;

    Repository.getAtResource(resourcePath, function(err, repository){
        if(err || !repository)
        {
            callback(err, null, repository);
        } else {
            repo = repository;
            racknames.forEach(function(rackname){
                loadRackFile(rackname);
            });
        }
    });
    function loadRackFile(rackname)
    {
        Spicerack.openSpecific(path.join(resourcePath, Constants.SPICES_DIR, getRackFileName(rackname)),
            function(err, rack){
                if(err)
                {
                    switch(err.code)
                    {
                        case 'ENOENT':
                            results[rackname] = new Spicerack();
                            results[rackname].Name = rackname;
                            break;
                        default:
                            errors[rackname] = err;
                    }
                } else {
                    results[rackname] = rack;
                }
                asyncBlock -= 1;

                if(asyncBlock <= 0)
                {
                    loadingRackFilesComplete();
                }

            }
        );
    }

    function loadingRackFilesComplete()
    {
        //Squash errors
        if(Object.keys(errors).length == 0)
            errors = null;

        callback(errors, results, repo);
    }
};

Spicerack.openSpecific = function(filepath, callback)
{
    Storage.loadObjectFrom(filepath,
        function(err, data){
            if(!err && data)
            {
                callback(err, new Spicerack(data));
            } else {
                callback(err, null);
            }
        }
    );
};



function getRackFileName(rackname)
{
    return rackname + '.' +  DeviceID.ID + '.' + Constants.RACK_FILEEXT;
}


module.exports = Spicerack;