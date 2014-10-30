var EncryptedObject = require("./lib/Security/EncryptedObject");
var Storage = require("./lib/Storage");
var NodeRSA = require('node-rsa');

testWithPassword();
//testWithRSA();

function testWithPassword()
{

    var key = 'KDFDKFKKDFKDF';

    var origin = {foo: new Date()};
    var encrypted = EncryptedObject.encryptObjectPassword(origin, key);

    console.log(origin);
    Storage.storeObjectAs(encrypted, "./test.bson", function(){
        console.log(encrypted);
        Storage.loadObjectFrom("./test.bson", function(err, obj){
            if(err)
                throw err;
            var loadedEncrypted = EncryptedObject.fromBSON(obj);
            console.log(loadedEncrypted);
            var decrypted = loadedEncrypted.decryptPassword(key);
            console.log(decrypted);
        });
    });

}

function testWithRSA()
{

    var key = new NodeRSA('-----BEGIN RSA PRIVATE KEY-----\n'+
    'MIIBOQIBAAJAVY6quuzCwyOWzymJ7C4zXjeV/232wt2ZgJZ1kHzjI73wnhQ3WQcL\n'+
    'DFCSoi2lPUW8/zspk0qWvPdtp6Jg5Lu7hwIDAQABAkBEws9mQahZ6r1mq2zEm3D/\n'+
    'VM9BpV//xtd6p/G+eRCYBT2qshGx42ucdgZCYJptFoW+HEx/jtzWe74yK6jGIkWJ\n'+
    'AiEAoNAMsPqwWwTyjDZCo9iKvfIQvd3MWnmtFmjiHoPtjx0CIQCIMypAEEkZuQUi\n'+
    'pMoreJrOlLJWdc0bfhzNAJjxsTv/8wIgQG0ZqI3GubBxu9rBOAM5EoA4VNjXVigJ\n'+
    'QEEk1jTkp8ECIQCHhsoq90mWM/p9L5cQzLDWkTYoPI49Ji+Iemi2T5MRqwIgQl07\n'+
    'Es+KCn25OKXR/FJ5fu6A6A+MptABL3r8SEjlpLc=\n'+
    '-----END RSA PRIVATE KEY-----');


//key = "KDFDKFKKDFKDF";

    var origin = {foo: new Date()};
    var encrypted = EncryptedObject.encryptObjectRSA(origin, key);

    console.log(origin);
    Storage.storeObjectAs(encrypted, "./test.bson", function(){
        console.log(encrypted);
        Storage.loadObjectFrom("./test.bson", function(err, obj){
            if(err)
                throw err;
            var loadedEncrypted = EncryptedObject.fromBSON(obj);
            console.log(loadedEncrypted);
            var decrypted = loadedEncrypted.decryptRSA(key);
            console.log(decrypted);
        });
    });

}

/**/