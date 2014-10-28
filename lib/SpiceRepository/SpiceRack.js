function SpiceRack(spices, config)
{
    if(spices)
        this.Spices = spices;
    else
        this.Spices = {};

    this.Repository = config.repository;
    this.ReadOnly = config.readonly;

    Object.seal(this);
}

SpiceRack.prototype.toBSON = function(){
    return this.Spices;
};

/**
 * The UserID this rack belongs to. (null if none)
 * @type {string|null}
 */
SpiceRack.prototype.UserID = null;

/**
 * True, if the repository.save() method would ignore this rack and the Spices member would be sealed.
 * @type {boolean}
 */
SpiceRack.prototype.ReadOnly = false;

/**
 * The parent repository this rack belongs to
 * @type {SpiceRepository}
 */
SpiceRack.prototype.Repository = null;

/**
 * Plain javascript object, containing the actual data. This object will be sealed if the rack is ReadOnly
 * @type {Object}
 */
SpiceRack.prototype.Spices = null;



module.exports = SpiceRack;