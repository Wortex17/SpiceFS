var crypto = require("crypto");
var algorithm = 'aes256';

function RackManager()
{
    this._racks = {};

    var decryptedPrivates = {};
    var decryptedPrivatesKeys = {};
    this._getPrivate = function(userID, keys){


        if(!decryptedPrivates.hasOwnProperty(userID))
        {
            if(!keys || !keys.length)
                return null;

            decryptedPrivatesKeys[userID] = keys[0];

            if(!this._racks.hasOwnProperty(userID))
            {
				//New initialized
                decryptedPrivates[userID] = {};
            } else {
                //read and decrypt this._racks[userID] into decryptedPrivates[userID]. If decryption fails, return null.
                var decrypted = null;
                for(var i = 0; i < keys.length; i++)
                {
                    try {
                        var decipher = crypto.createDecipher(algorithm, keys[i]);
                        decrypted = JSON.parse(decipher.update(this._racks[userID], 'binary', 'utf8') + decipher.final('utf8'));
                    } catch(e) {
                        decrypted = null;
                    }
                    if(decrypted != null)
                        break;
                }

                if(decrypted == null)
                    return null;

				//Key politics is: if you update your key, you need to add it to your keychain. The newest key will always be used to encrypt, but all keys will be tried to decrypt
				decryptedPrivates[userID] = decrypted;
			}
        }
        return decryptedPrivates[userID];
    };
    this._writeBackPrivates = function(){
        for(var userID in decryptedPrivates)
        {
            if(decryptedPrivates.hasOwnProperty(userID))
            {
                var privates = decryptedPrivates[userID];
                //key used for encryption
                var $key = decryptedPrivatesKeys[userID];
				
				//Check if object still contains members
				if(Object.keys(privates).length < 1)
				{
					//Delete from storage, to preserve space
					delete this._racks[userID];
				} else {
					//encrypt 'privates' with $key
                    var cipher = crypto.createCipher(algorithm, $key);
                    var encrypted = cipher.update(JSON.stringify(privates), 'utf8', 'binary') + cipher.final('binary');
					//write back
					this._racks[userID] = encrypted;
				}
            }
        }
    };
}
RackManager.prototype._racks = null;
RackManager.prototype.getPublic = function()
{
    if(!this._racks.hasOwnProperty('*'))
    {
        this._racks['*'] = {};
    }
    return this._racks['*'];
};
/**
 *
 * @param {string} userID
 * @param {string[]} keys - all keys that may be used to decrypt, sorted from newest to oldest. only the newest key will be used to encrypt
 * @returns {*|null} - null is returned, if decryption failed, and empty object if nothing was stored before
 */
RackManager.prototype.getPrivate = function(userID, keys)
{
    if(!Array.isArray(keys))
        keys = [];
    if(userID == '*')
        return null;
    return this._getPrivate(userID, keys);
};
RackManager.prototype._getPrivate = function(userID, keys)
{
    throw "RackManager not correctly initialized";
};
RackManager.prototype._writeBackPrivates = function()
{
    throw "RackManager not correctly initialized";
};
RackManager.prototype.toBSON = function()
{
    return this.toData
};
RackManager.prototype.toData = function()
{
    this._writeBackPrivates();
    return this._racks;
};
RackManager.fromData = function(data)
{
    var racks = new RackManager();
    racks._racks = data;
    return racks;
};

module.exports = RackManager;