/**
 * 配置条目删除
 * @param item
 */
function deleteDBName(item) {
    var tr = item.parents('tr');
    var form = tr.find('form');
    form.attr('action', '/kc/config/delete');
    form.submit();
}

/**
 * 配置条目编辑
 * @param item
 */
function editItem(item) {

    var tr = item.parents('tr');
    var form = tr.find('form');
    var input = tr.find('input.value');

    var save = item.attr('save');
    if (save) {
        form.submit();

    } else {

        item.text('保存');
        item.attr('save', true);
        tr.addClass('insert');
        form.attr('action', '/kc/config/edit');
        input.removeAttr("readonly");
    }


}