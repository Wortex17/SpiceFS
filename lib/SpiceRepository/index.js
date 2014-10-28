var path = require("path"),
    fs = require("fs.extra"),
    util = require("util")
    ;

var Storage = require("../Storage"),
    UniqueID = require("../UniqueID"),
    WinAttrib = require("../WinAttrib")
    ;
var SpiceRack = require("./SpiceRack"),
    KeyRing = require("./SpiceRack/KeyRing")
    ;


var REPOSITORY_SUBDIR = "."+path.sep+".spices";
var REPOSITORY_FILE = "spice.repository";
var RACK_FILE_END = ".spice.rack";


function loadRepoDataFrom(repoFilePath, callback)
{
    Storage.loadObjectFrom(repoFilePath, callback);
}

function makeRackReadOnly(rack)
{
    rack.ReadOnly = true;
    Object.seal(rack.Spices);
}

function makeupRepoDir(repo, callback)
{
    fs.copyRecursive(SpiceRepository.MAKEUP_DIR, repo.Path, function(err){
        if(err)
            return callback(err);
        WinAttrib.quickChange(repo.Path, "+S", function(err){
            callback(err);
        });
    });
}

function SpiceRepository(data, directory)
{
    var that = this;
    var _racks = {
        '*': new SpiceRack(null, {
            repository: that
        })
    };

    that.Directory = path.resolve(directory);

    if(data)
    {
        that.ID = data.ID;
        that.IsNew = false;
        _racks["*"] = new SpiceRack(data["PublicRack"], {
            repository: that
        });
    } else {
        that.ID = UniqueID.generateUUID();
        that.IsNew = true;
    }

    Object.defineProperties(this, {

        Path: {
            get: function(){
                return path.join(that.Directory, REPOSITORY_SUBDIR);
            }
        },

        toBSON: {
            value: function() {
                return {
                    ID: that.ID,
                    PublicRack: _racks["*"]
                };
            }
        },

        openPublicRack: {
            value: function(callback) {
                callback(null, _racks["*"]);
            }
        }
    });

    Object.seal(this);

}
SpiceRepository.MAKEUP_DIR = path.join(__dirname, "../../assets/makeup");

/**
 * Opens a directory and creates or loads a repository for this directory.
 * The callback gets two arguments (err, repository)
 * whereas repository will be null if the directory could not be loaded.
 * @param directory
 * @param callback
 */
SpiceRepository.openAt = function(directory, callback){
    loadRepoDataFrom(path.join(directory, REPOSITORY_SUBDIR, REPOSITORY_FILE), function(err, data){
        if(err)
            return callback(err, new SpiceRepository(null, directory));

        var repo = new SpiceRepository(data, directory);
        return callback(null, repo);
    });
};

/**
 * A globally (nearly) unique ID, generated freshly on repository generation.
 * @readonly
 * @type {string}
 */
SpiceRepository.prototype.ID = "";
/**
 * Is true, if this repo only exists in memory until now (i.e. was not loaded from, or saved to disk).
 * @readonly
 * @type {boolean}
 */
SpiceRepository.prototype.IsNew = "";

/**
 * The filesystem path to the .spices directory.
 * @readonly
 * @type {string}
 */
SpiceRepository.prototype.Path = "";
/**
 * @readonly
 * @type {string}
 */
SpiceRepository.prototype.Directory = "";

/**
 * Write the metadata to the filesystem. Serializes all linked racks, ignoring readonly racks.
 * The callback gets two arguments *(err, repository)*.
 *
 * NOTE: Because repository.save() just overwrites any file with the new data, avoid opening multiple
 * repositories at the same time, as they would not merge their changes on disk.
 * @param callback
 */
SpiceRepository.prototype.save = function(callback){
    var that = this;
    if(typeof callback !== "function")
        callback = function(){};
    fs.stat(this.Directory, function(err, stats){
        if(err)
            return callback(err, null);
        if(!stats.isDirectory())
            return callback(new Error("Repository cannot be created under " + that.Directory), null);

        fs.mkdirp(that.Path, function(err){
            if(err)
                return callback(err);

            WinAttrib.quickCopy(SpiceRepository.MAKEUP_DIR, that.Path, "+H", function(err){
                if(err)
                    console.warn(err);
                Storage.storeObjectAs(that, path.join(that.Path, REPOSITORY_FILE), function(err){
                    if(err)
                        callback(err);
                    else if(that.IsNew) {
                        makeupRepoDir(that, function (err) {
                            callback(err, that)
                        });
                    } else {
                        callback(null, that);
                    }
                });
            });
        });
    });

};

/**
 * Deletes the complete *.spices* directory from the filesystem and purges all metadata.
 * The callback gets one argument *(err)*.
 * @param callback
 */
SpiceRepository.prototype.purge = function(callback){
    var that = this;
    WinAttrib.quickReset(that.Path, function(err){
        if(err)
            return callback(err);

        fs.rmrf(that.Path, callback);
    });
};
/**
 * Tries to open (or create) a public rack of this repository. Beware that the public rack is completely unprotected.
 * The callback gets two arguments *(err, publicRack)*
 * @param callback
 */
SpiceRepository.prototype.openPublicRack = function(callback){
    throw "STUB";
};
SpiceRepository.prototype.openProtectedRackOf = function(userid, keyring, callback){
    throw "STUB";
};
SpiceRepository.prototype.openPrivateRackOf = function(userid, keyring, callback){
    throw "STUB";
};
SpiceRepository.prototype.openRacksOf = function(userid, keyring, callback){
    throw "STUB";
};

module.exports = SpiceRepository;