var bufferEqual = require('buffer-equal'),
    observe = require('observed')
    ;
var Storage = require("../Storage"),
    select = require("../select")
    ;

function SpicesDrawer(config)
{
    if(!config)
        config = {};

    var that = this;
    this.Contents = config['Contents'] || {};
    this.Log = config['Log'] || {};
    this.ParentShelf = config['Shelf'] || null;
    this._Observer = observe(this.Contents);


    this._startLogging();
}
SpicesDrawer.prototype.ParentShelf = null;
SpicesDrawer.prototype.Name = "";
/**
 * Key is the Same key as in Contents
 * Value is the Last-Date-Modified
 * @type {{}}
 */
SpicesDrawer.prototype.Log = null;
/**
 * Actual Data on which we should work
 * @type {{}}
 */
SpicesDrawer.prototype.Contents = null;
/**
 * @type {*}
 * @private
 */
SpicesDrawer.prototype._Observer = null;
/**
 * Checks if this Drawer is still Open
 * @type {boolean}
 */
SpicesDrawer.prototype.IsOpen = true;

SpicesDrawer.prototype.toBSON = function(){
    return {
        Contents: this.Contents,
        Log: this.Log
    }
};

SpicesDrawer.prototype._handleChange = function(event){
    var lvl1Name = event.path.split('.')[0];
    if(event.value != event.oldValue)
    {
        this.Log[lvl1Name] = currentLogTime();
    }
};
SpicesDrawer.prototype._startLogging = function(){
    var that = this;
    this._$changeListener = function(event){
        that._handleChange(event);
    };

    this._Observer.on('change', this._$changeListener);
};
SpicesDrawer.prototype._stopLogging = function(){
    this._Observer.removeListener('change', this._$changeListener);
    delete this._$changeListener;
};

SpicesDrawer.prototype.recalculateLog = function(){
    //Immediately deliver changes so the log gets updated automatically
    this._Observer.deliverChanges();
};

/**
 * Merges the other drawer into this one, replacing old entries with new ones
 * Since the other drawer is recaluclated one call later, it's changes are preferred. Beware of that in short-time change&merge
 * If you want to prefere this drawer in that calculation, call other.recalculateLog(); before
 * @param {SpicesDrawer} other
 */
SpicesDrawer.prototype.mergeDrawer = function(other){
    var that = this;
    that.recalculateLog();
    other.recalculateLog();

    that._stopLogging();

    for(var key in other.Log)
    {
        if(other.Log.hasOwnProperty(key))
        {
            if(logTimeIsYoungerThan(that.Log[key], other.Log[key]))
            {
                //The other has a newer change
                that.Log[key] = other.Log[key];
                if(other.Contents[key])
                {
                    that.Contents[key] = other.Contents[key];
                } else {
                    delete that.Contents[key];
                }
            }
        }
    }

    that._startLogging();
};


function currentLogTime() {
    var ptime = process.hrtime();
    return [Date.now(), ptime[0] * 1e3 + ptime[1] * 1e-6];
}
function logTimeIsYoungerThan(logTimeA, logTimeB)
{
    if(!logTimeB)
        return false;
    return (!logTimeA ||
            (
                logTimeA[0] < logTimeB[0] ||
                (logTimeA[0] == logTimeB[0] && logTimeA[1] < logTimeB[1])
            )
    );
}


module.exports = SpicesDrawer;