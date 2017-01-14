/**
 * Map function - use `emit(key, value)1 to generate rows in the output result.
 * @link http://docs.couchdb.org/en/latest/couchapp/ddocs.html#reduce-and-rereduce-functions
 *
 * @param {object} doc - Document Object.
 */
function(doc) {
    if (doc.order && doc.order.orderInfo && doc.order.orderInfo.orderstatus && doc.order.orderInfo.returntime) {
        emit(doc.order.orderInfo.orderid,null);
    }
}
