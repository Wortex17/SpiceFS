var NodeRSA = require('node-rsa');

function SpiceRackKey(data)
{
    this._RSA = new NodeRSA();
    if(!data)
    {
        this.TimeStamp = Date.now();
        this._RSA.generateKeyPair();
    } else {
        this.TimeStamp = data.TimeStamp;
        this._RSA.loadFromPEM(data.PEM);
    }

}
/**
 * @type {NodeRSA}
 * @private
 */
SpiceRackKey.prototype._RSA = null;
/**
 * UNIX Timestamp this key was created on
 * @readonly
 * @type {number}
 */
SpiceRackKey.prototype.TimeStamp = 0;

/**
 * @return {boolean}
 */
SpiceRackKey.prototype.canReadProtected = function(){
    return this._RSA.isPublic();
};
/**
 * @return {boolean}
 */
SpiceRackKey.prototype.canWriteProtected = function(){
    return this._RSA.isPrivate();
};
/**
 * @return {boolean}
 */
SpiceRackKey.prototype.canReadPrivate = function(){
    return this._RSA.isPrivate();
};
/**
 * @return {boolean}
 */
SpiceRackKey.prototype.canWritePrivate = function(){
    return this._RSA.isPrivate();
};
SpiceRackKey.prototype.openProtectedRack = function(){
    return this._RSA.isPrivate();
};

SpiceRackKey.prototype.toBSON = function(){
    return {
        TimeStamp: this.TimeStamp,
        PEM: (this._RSA.isPrivate()) ? this._RSA.getPrivatePEM() : this._RSA.getPublicPEM()
    }
};
SpiceRackKey.prototype.getPublicCopy = function(){
    return new SpiceRackKey({
        TimeStamp: this.TimeStamp,
        PEM: this._RSA.getPublicPEM()
    });
};

module.exports = SpiceRackKey;