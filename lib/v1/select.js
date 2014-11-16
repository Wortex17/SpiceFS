/**
 * Get a nested child object by its path.
 * The path describes keys in order from highest selector to last, using '.' as separator
 * Throws an exception if any object except the last one in the chain is found to be null
 * @param obj
 * @param path
 * @return {*}
 */
module.exports = function select(obj, path){
    var paths = path.split('.')
        , current = obj
        , i;

    for (i = 0; i < paths.length; ++i) {
        if (current[paths[i]] == undefined) {
            return undefined;
        } else {
            current = current[paths[i]];
        }
    }
    return current;
};