function RackManager()
{
    this._racks = {};

    var decryptedPrivates = {};
    this._getPrivate = function(userID, keys){
        if(!decryptedPrivates.hasOwnProperty(userID))
        {
            if(!this._racks.hasOwnProperty(userID))
            {
				//New initialized
                decryptedPrivates[userID] = {
					'$key': keys[0]
				};
            } else {
                //@todo read and decrypt this._racks[userID] into decryptedPrivates[userID]. If decryption fails, return null.
                var decrypted = {};
				//Key politics is: if you update your key, you need to add it to your keychain. The newest key will always be used to encrypt, but all keys will be tried to decrypt
                decrypted['$key'] = keys[0];
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
                var $key = privates['$key'];
				//delete $key from further inspection
                delete privates['$key'];
				
				//Check if object still contains members
				if(Object.keys(privates).length < 1)
				{
					//Delete from storage, to preserve space
					delete this._racks[userID];
				} else {
					
					//@todo encrypt 'privates' with $key
					var encrypted = privates;
					
					//write back
					this._racks[userID] = encrypted;
				}
				//Now restore key again, for the next writeBack
				privates['$key'] = $key;
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