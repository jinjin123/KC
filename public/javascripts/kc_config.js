function addDBName(item) {
    var tr = item.parents('tr');
    var form = tr.find('form');
    form.attr('action', '/kc/config/add');
    var mc_id = tr.find("input[name='mc_id']").val();
    var oc_user = tr.find("input[name='oc_user']").val();
    var oc_pwd = tr.find("input[name='oc_pwd']").val();
    var db_user = tr.find("input[name='db_user']").val();
    var db_pwd = tr.find("input[name='db_pwd']").val();
    if (!mc_id || !oc_user || !oc_pwd || !db_user || !db_pwd) {
        layer.msg('请填写正确的数据！', {icon: 2});
    } else {
        layer.msg('开始添加数据库！', {icon: 1});
        form.submit();
    }

}

/**
 * 删除数据库
 * @param item
 */
function deleteDBName(item) {
    var tr = item.parents('tr');
    var form = tr.find('form');
    form.attr('action', '/kc/config/delete');
    layer.confirm('您确定要删除数据库？', {
        btn: ['确定','取消'] //按钮
    }, function(){
        layer.msg('开始删除数据库！', {icon: 1});
        form.submit();
    }, function(){
        layer.msg('取消成功！', {icon: 1});
    });
}

/**
 * 清空数据
 * @param item
 */
function deleteDBData(item) {
    var tr = item.parents('tr');
    var form = tr.find('form');
    form.attr('action', '/kc/config/data/delete');
    layer.confirm('您确定要清空数据？', {
        btn: ['确定','取消'] //按钮
    }, function(){
        layer.msg('开始清空数据！', {icon: 1});
        form.submit();
    }, function(){
        layer.msg('取消成功！', {icon: 1});
    });
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
        layer.confirm('您确定要保存本次修改？', {
            btn: ['确定','取消'] //按钮
        }, function(){
            layer.msg('开始保存数据！', {icon: 1});
            form.submit();
        }, function(){
            layer.msg('取消成功！', {icon: 1});
        });

    } else {

        item.text('保存');
        item.attr('save', true);
        tr.addClass('insert');
        form.attr('action', '/kc/config/edit');
        input.removeAttr("readonly");
    }


}