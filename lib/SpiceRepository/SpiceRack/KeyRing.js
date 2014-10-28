var SpiceRackKey = require("./Key"),
    Storage = require("../../Storage");
;


function SpiceRackKeyRing(data)
{
    var that = this;
    that._Keys = [];
    if(typeof data === 'string')
    {
        //Interpret as userid
        this.UserID = data;
    } else if(!!data) {
        data.Keys.forEach(function(keydata){
            try {
                that.addKey(new SpiceRackKey(keydata));
            } catch(e) {

            }
        });
        this.UserID = data.UserID;
    }
}
/**
 * Returns only public versions of keys (for read-only)
 */
SpiceRackKeyRing.prototype.getPublicKeys = function(key){
    var keys = [];
    for(var i = 0; i < this._Keys.length; i++)
    {
        keys[i] = this._Keys[i].getPublicCopy();
    }
    return keys;
};
/**
 *
 * @param {SpiceRackKey} key
 */
SpiceRackKeyRing.prototype.addKey = function(key){
    if(key instanceof SpiceRackKey)
    {
        if(this.hasKeyTimeStamp(key.TimeStamp))
        {
            throw "Key with that Timestamp already exists";
        }
        this._Keys.push(key);
        this._Keys.sort(function(a, b){return b.TimeStamp- a.TimeStamp});
    } else {
        throw new Error("Can only add Key of Type SpiceRackKey");
    }
};

SpiceRackKeyRing.prototype.addNewKey = function(){
    var key = new SpiceRackKey();
    this.addKey(key);
    return key;
};

SpiceRackKeyRing.prototype.hasKeyTimeStamp = function(timeStamp){
    for(var i = 0; i < this._Keys.length; i++)
    {
        if(this._Keys[i].TimeStamp == timeStamp)
            return true;
    }
    return false;
};
SpiceRackKeyRing.prototype.getNewestWriteKey = function(){
    for(var i = 0; i < this._Keys.length; i++)
    {
        if(this._Keys[i].canWriteSomeProtected())
            return this._Keys[i];
    }
    return null;
};
SpiceRackKeyRing.prototype.canReadSomeProtected = function(){
    for(var i = 0; i < this._Keys.length; i++)
    {
        if(this._Keys[i].canReadProtected())
            return true;
    }
    return false;
};

SpiceRackKeyRing.prototype.canReadSomeProtected = function(){
    for(var i = 0; i < this._Keys.length; i++)
    {
        if(this._Keys[i].canReadProtected())
            return true;
    }
    return false;
};
SpiceRackKeyRing.prototype.canWriteSomeProtected = function(){
    for(var i = 0; i < this._Keys.length; i++)
    {
        if(this._Keys[i].canWriteProtected())
            return true;
    }
    return false;
};
SpiceRackKeyRing.prototype.canReadSomePrivate = function(){
    for(var i = 0; i < this._Keys.length; i++)
    {
        if(this._Keys[i].canReadPrivate())
            return true;
    }
    return false;
};
SpiceRackKeyRing.prototype.canWriteSomePrivate = function(){
    for(var i = 0; i < this._Keys.length; i++)
    {
        if(this._Keys[i].canWritePrivate())
            return true;
    }
    return false;
};

SpiceRackKeyRing.prototype.toBSON = function(){
    return {
        Keys: this._Keys,
        UserID: this.UserID
    }
};

SpiceRackKeyRing.prototype.savePrivateToFile = function(filepath, callback){
    Storage.storeObjectAs(this, filepath, callback);
};
SpiceRackKeyRing.prototype.saveProtectedToFile = function(filepath, callback){
    Storage.storeObjectAs({
        Keys: this.getPublicKeys(),
        UserID: this.UserID
    }, filepath, callback);
};
SpiceRackKeyRing.openFromFile = function(filepath, callback){
    Storage.loadObjectFrom(filepath, function(err, obj){
        if(err)
            return callback(err);

        var keyring = null;
        try{
            keyring = new SpiceRackKeyRing(obj);
        } catch(err) {
            return callback(err);
        }
        return callback(null, keyring);
    });
};


module.exports = SpiceRackKeyRing;