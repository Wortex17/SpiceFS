var fs = require("fs.extra"),
    bson = require("bson").BSONPure,
    BSON = bson.BSON
    ;
/**
 * Converts a JS object to internal representation
 * Currently chosen representation is BSON
 *
 * To iteract with serialization, give the object the method "toBSON"
 *
 * @param object
 * @param {boolean} [allowFunctions=false] - It's easy to allow encoding/decoding of functions, but it's a security risk. Maybe only allow it in encrypted serializations
 * @returns {*|Buffer}
 */
exports.serializeObject = function serializeObject(object, allowFunctions)
{
    return BSON.serialize(object, false, true, allowFunctions);
};
exports.deserializeObject = function deserializeObject(data, allowFunctions)
{
    return BSON.deserialize(data, {
        evalFunctions: allowFunctions
    });
};

/**
 * Converts a JS object to internal representation and stores it in a file
 * Currently chosen representation is BSON
 * @param object
 * @param filepath
 * @param callback
 */
exports.storeObjectAs = function storeObjectAs(object, filepath, callback)
{
    if(typeof(callback) !== 'function')
        callback = function(){};

    var serialized;
    try {
        serialized = exports.serializeObject(object);
        fs.writeFile(filepath, serialized, function(err){
            callback(err, serialized);
        });
    } catch(e){
        callback(e);
    }
};

exports.loadObjectFrom = function loadObjectFrom(filepath, callback)
{
    if(typeof(callback) !== 'function')
        callback = function(){};

    fs.readFile(filepath, function(err, data){
        if(err)
        {
            callback(err);
        } else {
            try {
                var object = exports.deserializeObject(data);
            } catch(e){
                return callback(e);
            }
            return callback(null, object);
        }
    });
};