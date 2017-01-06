/**
 * Replication filter function
 * @link http://docs.couchdb.org/en/latest/couchapp/ddocs.html#reduce-and-rereduce-functions
 *
 * @param {object} doc - Document Object.
 * @param {object} req - Request Object. http://docs.couchdb.org/en/latest/json-structure.html#request-object
 *
 * @return {boolean} True to let the document through; false to prevent it.
 **/
function(doc, req) {
    if (doc._id.match(/^_design\//)) {
        if (doc.order === undefined) {
            return true;
        }
    }
    return false;
}
