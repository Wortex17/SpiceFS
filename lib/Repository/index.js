var path = require("path"),
    fs = require("fs.extra"),
    util = require("util")
    ;

var Storage = require("../Storage"),
    UniqueID = require("../UniqueID"),
    WinAttrib = require("../WinAttrib")
    ;

var REPOSITORY_SUBDIR = "."+path.sep+".spices";
var REPOSITORY_FILE = "repository.bson";

function Repository(data)
{
    if(data)
    {
        return Repository.fromData(data);
    }

    this.id = UniqueID.generateUUID();
}
Repository.MAKEUP_DIR = path.join(__dirname, "../../assets/makeup");
/**
 * @readonly
 * @type {string}
 */
Repository.prototype.id = "";
/**
 * @readonly
 * @type {string}
 */
Repository.prototype.path = "";
/**
 * The path to the repo subdir
 * @readonly
 * @type {string}
 */
Repository.prototype.dirPath = "";
/**
 * The path to the repo file
 * @readonly
 * @type {string}
 */
Repository.prototype.repoPath = "";
/**
 * States if this Repository was not loaded from disk. Set to false, as soon as it is saved once, or loaded
 * @readonly
 * @type {boolean}
 */
Repository.prototype.isFresh = true;

Repository.prototype.mkdirp = function(callback)
{
    return fs.mkdirp(this.path, callback);
};

Repository.prototype.mkdirpSync = function()
{
    return fs.mkdirpSync(this.path);
};

Repository.prototype.removeFromFS = function(callback)
{
    var that = this;
    WinAttrib.quickReset(that.dirPath, function(err){
        if(err)
            return callback(err);

        fs.rmrf(that.dirPath, callback);
    });
};

Repository.prototype.save = function(callback)
{
    var that = this;
    fs.stat(that.path, function(err, stat){
        if(err)
            callback(err);
        else if(!stat.isDirectory())
            callback(new Error(that.path+" is no directory"));
        else
        {
            fs.mkdirp(that.dirPath, function(err){
                if(err)
                    return callback(err);

                WinAttrib.quickCopy(Repository.MAKEUP_DIR, that.dirPath, "+H", function(err){
                    if(err)
                        console.warn(err);
                    Storage.storeObjectAs(that, that.repoPath, function(err){
                        if(err)
                            callback(err);
                        else that.makeupRepoDir(callback);
                    });
                });
            });
        }
    });
};
Repository.prototype.makeupRepoDir = function(callback)
{
    var that = this;
    fs.copyRecursive(Repository.MAKEUP_DIR, that.dirPath, function(err){
        if(err)
            return callback(err);
        WinAttrib.getAttribs(Repository.MAKEUP_DIR + path.sep + "*", function(err, attribs){
            if(err)
                return callback(err);
            function iterate(i)
            {
                if(i >= attribs.length)
                    return callback();
                var winAttrib = attribs[i];
                winAttrib.file = path.join(that.dirPath, path.relative(Repository.MAKEUP_DIR, winAttrib.file));
                winAttrib.apply(function(err){
                    if(err)
                        return callback(err);
                    iterate(i+1);
                });
            }
            iterate(0);

        });
    });
};

Repository.prototype.toBSON = function()
{
    return this.toData();
};
Repository.prototype.toData = function()
{
    return {
        id: this.id
    }
};
Repository.fromData = function(data)
{
    var repo = new Repository();
    repo.isFresh = false;
    this.id = data.id;
    return repo;
};

Repository.open = function(dirPath, options, callback)
{
    var pOptions = {
        createNew: true
    };

    if(arguments.length < 3)
    {
        callback = arguments[1];
    }
    else {
        pOptions = util._extend(pOptions, options);
    }
    dirPath = path.resolve(process.cwd(), dirPath);
    getRepositoryDataAt(path.join(dirPath, REPOSITORY_SUBDIR), function(err, repoData){
        var repo;
        if(!repoData && pOptions.createNew)
        {
            repo = new Repository();
        } else {
            repo = Repository.fromData(repoData);
        }

        if(repo)
        {
            repo.path = path.join(dirPath);
            repo.dirPath = path.join(dirPath, REPOSITORY_SUBDIR);
            repo.repoPath = path.join(dirPath, REPOSITORY_SUBDIR, REPOSITORY_FILE);
        }

        callback(err, repo);
    });
};

function getRepositoryDataAt(repoPath, callback)
{
    Storage.loadObjectFrom(path.join(repoPath, REPOSITORY_FILE), callback);
}

module.exports = Repository;