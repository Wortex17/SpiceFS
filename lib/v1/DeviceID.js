var os = require("os"),
    crypto = require('crypto')
    ;



function getString()
{
    var stringID = os.type() + os.platform() + os.arch() + os.hostname();
    stringID += getNICSString();
    return stringID;
}

function getNICSString()
{
    var nicsString = "";
    var nics = os.networkInterfaces();
    var ips = [];
    Object.keys(nics).forEach(function(key){
        if(nics.hasOwnProperty(key))
        {
            nics[key].forEach(function(interf){
                ips.push(interf['address']);
            });
        }
    });
    ips.sort();
    ips.forEach(function(ip){
        nicsString += "|" + ip;
    });
    return nicsString;
}


function getHash(stringId)
{
    var shasum = crypto.createHash('md5');
    shasum.update(stringId, 'utf8');
    return shasum.digest('hex');
}

exports.generateDID = function(){
    return (getHash(getString()));
};

exports.DeviceID = exports.generateDID();
exports.DID = exports.DeviceID;
exports.ID = exports.DeviceID;