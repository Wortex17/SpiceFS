var exec = require('child_process').exec,
    os = require('os')
    ;


//+R has to be set on a folder, for desktop.ini to be read
//+H is set to hide on windows. The "." prefix on the name hides it on *NIX

function WinAttrib()
{

}
WinAttrib.prototype["Archive"] = false;
WinAttrib.prototype["Read-only"] = false;
WinAttrib.prototype["System"] = false;
WinAttrib.prototype["Hidden"] = false;
WinAttrib.prototype["Not content indexed"] = false;
WinAttrib.prototype["No scrub"] = false;
WinAttrib.prototype.file = null;

WinAttrib.prototype.apply = function(callback){
    if(typeof(callback) !== 'function')
        callback = function(){};

    var that = this;
    exec('attrib '+WinAttrib.getAttribResetStr()+'\"' + that.file + "\"",
        function (error, stdout) {
            if (error) {
                callback(error);
            } else if (stdout) {
                callback(stdout);
            } else {
                var cmd = 'attrib '+that.getAttribSetStr()+'\"' + that.file + "\"";
                exec(cmd,
                    function (error, stdout) {
                        if (error) {
                            callback(error);
                        } else if (stdout) {
                            callback(stdout);
                        } else {
                            callback(null, that);
                        }
                    });
            }
        });
};

WinAttrib.prototype.getAttribStr = function(){
    var str = "            ";
    if(this["Archive"])
        str[0] = "A";
    if(this["System"])
        str[3] = "S";
    if(this["Hidden"])
        str[4] = "H";
    if(this["Read-only"])
        str[5] = "R";
    if(this["Not content indexed"])
        str[8] = "I";
    if(this["No scrub"])
        str[11] = "X";
    return str;
};

WinAttrib.prototype.getAttribSetStr = function(){
    var str = " ";
    if(this["Archive"])
        str += "+A ";
    if(this["System"])
        str += "+S ";
    if(this["Read-only"])
        str += "+R ";
    if(this["Hidden"])
        str += "+H ";
    if(this["Not content indexed"])
        str += "+I ";
    if(this["No scrub"])
        str += "+X ";
    return str;
};

WinAttrib.prototype.change = function(str){
    var that = this;
    var strs = str.split(" ");
    strs.forEach(function(str){
        if(str.length == 2 && (str[0] == "+" || str[0] == "-"))
        {
            for(var name in WinAttrib.Map.Named)
            {
                if(WinAttrib.Map.Named.hasOwnProperty(name) && WinAttrib.Map.Named[name] == str[1])
                {
                    that[name] = (str[0] == "+");
                    break;
                }
            }
        }
    });
};

WinAttrib.Map = {
    Named: {
        "Archive": "A",
        "System": "S",
        "Hidden": "H",
        "Read-only": "R",
        "Not content indexed": "I",
        "No scrub": "X"
    },
    Short: {
        A: 0,
        S: 3,
        H: 4,
        R: 5,
        I: 8,
        X: 11
    }
};

WinAttrib.getAttribResetStr = function(){
    return "-A -S -R -H -I -X ";
};

WinAttrib.parseAttribStr = function parseAttribStr(attribStr){
    if(attribStr.length < 13)
        throw "attribStr too short (needs at least 13 characters)";

    var attribs = new WinAttrib();
    attribs["Archive"] = expectChar(0, 'A');
    attribs["System"] = expectChar(3, 'S');
    attribs["Hidden"] = expectChar(4, 'H');
    attribs["Read-only"] = expectChar(5, 'R');
    attribs["Not content indexed"] = expectChar(8, 'I');
    attribs["No scrub"] = expectChar(11, 'X');

    return attribs;
    function expectChar(idx, char)
    {
        if(attribStr[idx] == char)
            return true;
        else if(attribStr[idx] == " ")
            return false;
        else
            throw "attribStr contains invalid char @" + idx+", expected whitespace or " + char;
    }
};

WinAttrib.getAttribs = function(path, callback){
    exec('attrib \"' + path + "\"",
        function (error, stdout) {
            if (error) {
                callback(error);
            } else {

                var winAttribs = [];

                var feedback = stdout.split(os.EOL);
                for(var i = 0; i < feedback.length; i++)
                {
                    var line = feedback[i];
                    if(line.length <= 1)
                        continue;
                    var attribStr = line.substr(0, 13);
                    var fileStr = line.substr(13);
                    var winAttrib;
                    try {
                        winAttrib = WinAttrib.parseAttribStr(attribStr);
                    } catch(e) {
                        return callback(line);
                    }
                    winAttrib.file = fileStr;
                    winAttribs.push(winAttrib);
                }
                callback(null, winAttribs);
            }
        });
};

WinAttrib.quickChange = function(path, attribSetStr, callback){
    WinAttrib.getAttribs(path, function(err, attribs){
        if(err || attribs.length > 1)
            return callback(err);
        var winAttrib = attribs[0];
        winAttrib.change(attribSetStr);
        winAttrib.apply(callback);
    })
};
WinAttrib.quickReset = function(path, callback){
    exec('attrib '+WinAttrib.getAttribResetStr()+'\"' + path + "\"",
        function (error, stdout) {
            if (error) {
                callback(error);
            } else if (stdout) {
                callback(stdout);
            } else {
                callback(null);
            }
        });
};
WinAttrib.quickCopy = function(fromPath, toPath, change, callback){
    WinAttrib.getAttribs(fromPath, function(err, attribs){
        if(err || attribs.length > 1)
            return callback(err);
        var attrib = attribs[0];
        attrib.change(change);
        WinAttrib.quickChange(toPath, attrib.getAttribSetStr(), callback)
    })
};

module.exports = WinAttrib;