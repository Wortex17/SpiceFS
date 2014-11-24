var
    crypto = require('crypto')
    ;
var
    NodeRSA = require('node-rsa')
    ;
var
    Storage = require('../Storage')
    ;

var ENC_ALGORITHM = "aes256";

function EncryptedObject(binaryCipheredObj, encryptedCipherKey, isRSA)
{
    this.BinaryCipheredData = binaryCipheredObj;
    this.EncryptedCipherKey = encryptedCipherKey;
    this.IsRSA = isRSA;
}
EncryptedObject.fromBSON = function(bsonObj){
    var binaryCipheredObj = bsonObj['BinaryCipheredData'];
    var encryptedCipherKey = bsonObj['EncryptedCipherKey'];
    var isRSA = bsonObj['IsRSA'];
    if(!binaryCipheredObj)
        throw "BinaryCipheredData is no binary string but "+binaryCipheredObj;
    if(!encryptedCipherKey)
        throw "EncryptedCipherKey is no binary string but "+encryptedCipherKey;
    if(typeof isRSA !== 'boolean')
        throw "IsRSA is no boolean but "+encryptedCipherKey;
    encryptedCipherKey = new Buffer(encryptedCipherKey, 'binary');
    return new EncryptedObject(binaryCipheredObj, encryptedCipherKey, isRSA);
};
/**
 * Generates and EncryptedObject from a normal object
 * @param object - the object to encrypt
 * @param rsaKey {NodeRSA}
 * @param [serializeFunctions] {boolean} - should functions be serialized?
 * @return {EncryptedObject}
 */
EncryptedObject.encryptObjectRSA = function(object, rsaKey, serializeFunctions){
    var serialized = Storage.serializeObject(object, serializeFunctions);

    var cipherData = EncryptedObject._cipherSeralizedObject(serialized);
    //Encrypt the cipherKey (instead of whole object) with RSA
    var encryptedCipherKey = rsaKey.encrypt(cipherData[1]);

    return new EncryptedObject(cipherData[0], encryptedCipherKey, true);
};
/**
 *
 * @param object
 * @param password
 * @param serializeFunctions
 * @return {EncryptedObject}
 */
EncryptedObject.encryptObjectPassword = function(object, password, serializeFunctions){
    var serialized = Storage.serializeObject(object, serializeFunctions);

    var cipherData = EncryptedObject._cipherSeralizedObject(serialized);
    //Encrypt the cipherKey (instead of whole object) with password
    var cipher = crypto.createCipher(ENC_ALGORITHM, password);
    var encryptedCipherKey = Buffer.concat([cipher.update(cipherData[1], 'buffer', 'buffer'), cipher.final('buffer')]);

    return new EncryptedObject(cipherData[0], encryptedCipherKey, false);
};
/**
 *
 * @param serializedObject
 * @return {[*]} binary ciphered object and the key as array (refered to as cipherData)
 * @private
 */
EncryptedObject._cipherSeralizedObject = function(serializedObject){
    //Encrypt
    var cipherKey = EncryptedObject.generateRandomCipherKey();
    var cipher = crypto.createCipher(ENC_ALGORITHM, cipherKey);
    var ciphered = cipher.update(serializedObject, 'buffer', 'binary') + cipher.final('binary');
    return [ciphered, cipherKey];
};
EncryptedObject.generateRandomCipherKey = function(){
    return crypto.randomBytes(2048);
};

/**
 * Tries to decrypt this encrypted object
 * @param rsaKey {NodeRSA}
 * @return {*}
 */
EncryptedObject.prototype.decryptRSA = function(rsaKey){
    var cipherKey = this._decryptCipherKeyRSA(rsaKey);
    return this._decipher(cipherKey);
};
/**
 *
 * @param password
 * @return {*}
 */
EncryptedObject.prototype.decryptPassword = function(password){
    var cipherKey = this._decryptCipherKeyPassword(password);
    return this._decipher(cipherKey);
};
/**
 * Tells us whether the RSAKey would be able to decrypt the cipher and thus
 * COULD give us access to full decryption
 * Decryption may still fail of other reasons
 * @param rsaKey {NodeRSA}
 */
EncryptedObject.prototype.canUseRSAKeyToDecrypt = function(rsaKey){
    if(!this.IsRSA)
        return false;
    try {
        this._decryptCipherKeyRSA(rsaKey);
    } catch(e) {
        return false;
    }
    return true;
};
/**
 * Decrypts only the cipherKey fur further decryption of the object/content
 * @param rsaKey {NodeRSA}
 * @return {Buffer}
 * @private
 */
EncryptedObject.prototype._decryptCipherKeyRSA = function(rsaKey){
    if(!this.IsRSA)
        throw new Error("Object was not encrypted with RSA Key");
    return rsaKey.decrypt(this.EncryptedCipherKey);
};
EncryptedObject.prototype._decryptCipherKeyPassword = function(password){
    if(this.IsRSA)
        throw new Error("Object was encrypted with RSA Key");
    var decipher = crypto.createDecipher(ENC_ALGORITHM, password);
    var deciphered = Buffer.concat([
        decipher.update(this.EncryptedCipherKey, 'buffer', 'buffer'), decipher.final('buffer')
    ]);

    return deciphered;
};
EncryptedObject.prototype._decipher = function(cipherKey){
    var decipher = crypto.createDecipher(ENC_ALGORITHM, cipherKey);
    var deciphered = Buffer.concat([
        decipher.update(this.BinaryCipheredData, 'binary', 'buffer'), decipher.final('buffer')
    ]);

    return Storage.deserializeObject(deciphered);
};
EncryptedObject.prototype.toBSON = function(){
    return {
        BinaryCipheredData: this.BinaryCipheredData,
        EncryptedCipherKey: this.EncryptedCipherKey.toString('binary'),
        IsRSA: this.IsRSA
    }
};

module.exports = EncryptedObject;