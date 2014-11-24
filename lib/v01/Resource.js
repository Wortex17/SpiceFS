var
    fs = require('fs'),
    path = require('path')
    ;
var
    Constants = require('./Constants')
    ;

/**
 * The Resource namespace handles getting Information about resources
 * A resource is, in SpiceFS terms, a directory on the filesystem which can be spiced
 * @namespace
 */
var Resource = {

    /**
     *
     * @param {string} resourcePath
     * @returns {string}
     */
    normalizePath: function(resourcePath)
    {
        return path.normalize(resourcePath);
    },

    /**
     *
     * @param {string} resourcePath
     * @param {Resource~existCallback} callback
     */
    exists: function(resourcePath, callback)
    {
        fs.stat(Resource.normalizePath(resourcePath), function(err, stat){
            if(err)
            {
                switch(err.code)
                {
                    case 'ENOENT':
                        callback(null, false);
                        break;
                    default:
                        callback(err);
                }
            } else {
                callback(null, stat.isDirectory());
            }
        });
    },

    listContents: function(resourcePath, callback)
    {
        fs.readdir(Resource.normalizePath(resourcePath), function(err, directoryItems){

            if(directoryItems)
            {
                //Strip the spices subdir
                var spicesElement = directoryItems.indexOf(Constants.SPICES_DIR);
                if ( ~spicesElement )
                    directoryItems.splice(spicesElement, 1);
            }

            callback(err, directoryItems);
        });
    }
};

/**
 *
 * @callback Resource~existCallback
 * @param err
 * @param {boolean} exists - if the resource exists and is a directory
 */


module.exports = Resource;