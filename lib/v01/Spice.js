var
    observe = require('observed')
    ;

/**
 * @constructor
 */
function Spice(data)
{
    this.Contents = {};
    this._Log = {};
    if(data)
    {
        this.Name = data.Name;
        this.Contents = data.Contents;
        this._Log = data._Log;
    }


    /**
     *
     * @type {*|exports}
     * @private
     */
    this._Observer = observe(this.Contents);
    this._startLogging();
}

Spice.prototype.Name = "";
/**
 * @type {{}}
 */
Spice.prototype.Contents = null;
/**
 * A Timelog, storing top-level changes to the Contents as two-component timestamps
 * @type {{}}
 * @private
 */
Spice.prototype._Log = null;
/**
 * A Timestamp formed with Date.now() when the last log entry has been made since this session's
 * spice creation. 0 means that nothing has changed since the spice instance was created.
 * @type {number}
 */
Spice.prototype.LatestChange = 0;
/**
 * @private
 */
Spice.prototype._Observer = null;

Spice.prototype.toBSON = function(){
    return {
        Name: this.Name,
        Contents: this.Contents,
        _Log: this._Log
    }
};



Spice.prototype._handleChange = function(event){
    var lvl1Name = event.path.split('.')[0];
    if(event.value != event.oldValue)
    {
        this._Log[lvl1Name] = currentLogTime();
        this.LatestChange = Date.now();
    }
};
Spice.prototype._startLogging = function(){
    var that = this;
    this._$changeListener = function(event){
        that._handleChange(event);
    };

    this._Observer.on('change', this._$changeListener);
};
Spice.prototype._stopLogging = function(){
    this._Observer.removeListener('change', this._$changeListener);
    delete this._$changeListener;
};

Spice.prototype.recalculateLog = function(){
    //Immediately deliver changes so the log gets updated automatically
    this._Observer.deliverChanges();
};

/**
 * Merges the other spice into this one, replacing old first-level entries with new ones
 * Since the other spice changes are recalculated one call later, it's changes are preferred. Beware of that in short-time change&merge
 * If you want to prefer this spice  in that calculation, call other.recalculateLog(); before
 * @param {Spice} otherSpice
 */
Spice.prototype.mergeChangesFrom = function(otherSpice)
{
    var that = this;
    that.recalculateLog();
    otherSpice.recalculateLog();

    that._stopLogging();

    for(var key in otherSpice._Log)
    {
        if(otherSpice._Log.hasOwnProperty(key))
        {
            if(logTimeIsYoungerThan(that._Log[key], otherSpice._Log[key]))
            {
                //The other has a newer change
                that._Log[key] = otherSpice._Log[key];
                if(otherSpice.Contents[key])
                {
                    that.Contents[key] = otherSpice.Contents[key];
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

module.exports = Spice;