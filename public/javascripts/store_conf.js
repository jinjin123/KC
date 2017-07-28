/**
 * 增加配置
 * @param self
 */
function addStoreConf(self) {
    var html = '<label>授权用户：<input id="store_auth_user" value="" ></label><br/>' +
        '<label>授权密码：<input id="store_auth_pass" value="" ></label>';

    var mc_id = self.parents('tr').find("input[name='mc_id']").val();
    var mc_pass = self.parents('tr').find("input[name='mc_pass']").val();
    var target = self.parents('tr').find("input[name='url']").val();
    var store_id = self.parents('tr').find("input[name='store_id']").val();

    if (!mc_id || !mc_pass || !target || !store_id) {
        layer.alert('请填写正确的数据！', {icon: 6});
    } else {
        layer.confirm(html, {
            btn: ['确定','取消']
        }, function(){
            var user = document.getElementById('store_auth_user').value;
            var pass = document.getElementById('store_auth_pass').value;
            couchDB.addStoreConf(mc_id, mc_pass, target, store_id, user, pass, function (data) {
                renderTbody(data);
                layer.msg('配置添加成功', {icon: 1});
            });
        }, function(){
            layer.msg('已取消添加', {icon: 1});
        });
    }
}

/**
 * 删除配置
 */
function deleteStoreConf(self) {
    var html = '<label>授权用户：<input id="store_auth_user" value="" ></label><br/>' +
        '<label>授权密码：<input id="store_auth_pass" value="" ></label>';

    var mc_id = self.parents('tr').find("input[name='mc_id']").val();
    var mc_type = self.parents('tr').find("input[checked='checked']").attr('name');
    console.log(mc_id);
    console.log(mc_type)

    layer.confirm(html, {
        btn: ['确定','取消']
    }, function(){
        var user = document.getElementById('store_auth_user').value;
        var pass = document.getElementById('store_auth_pass').value;
        couchDB.deleteStoreConf(mc_type+mc_id, user, pass,function (data) {
            renderTbody(data);
            layer.msg('配置删除成功', {icon: 1});
        });
    }, function(){
        layer.msg('已取消添加', {icon: 1});
    });
}

/**
 * 渲染列表
 * @param data
 */
function renderTbody(data) {
    var tr = '';
    var ftr = '';
    var kc_config_table = $('#kc_config_table');
    for (var i=0;i<data.length;i++) {
        tr += '<tr>' +
            '<td><input type="text" name="mc_id" value="'+ data[i].mc_id +'" disabled="disabled"></td>' +
            '<td><input type="text" name="mc_pass" value="'+ data[i].mc_pass +'" disabled="disabled"></td>' +
            '<td><input type="text" name="store_id" value="'+ data[i].store_id +'" disabled="disabled"></td>';
        if (data[i].mc_type === 'up') {
            tr += '<td><input type="text" name="url" value="'+ data[i].target +'" disabled="disabled"></td>';
            tr += '<td><input type="checkbox" name="up" checked="checked" disabled="disabled"></td>';
            tr += '<td><input type="checkbox" name="down" disabled="disabled"></td>';
        } else {
            tr += '<td><input type="text" name="url" value="'+ data[i].source +'" disabled="disabled"></td>';
            tr += '<td><input type="checkbox" name="up" disabled="disabled"></td>';
            tr += '<td><input type="checkbox" name="down" checked="checked" disabled="disabled"></td>';
        }
        tr += '<td>' +
            '<button type="button" onclick="deleteStoreConf($(this))">删除</button>' +
            '</td>' +
            '</tr>'
    }

    ftr += '<tr>' +
        '<td><input type="text" name="mc_id" ></td>' +
        '<td><input type="text" name="mc_pass" ></td>' +
        '<td><input type="text" name="store_id" ></td>' +
        '<td><input type="text" name="url" ></td>' +
        '<td><input style="margin-left: 35%;" type="checkbox" checked="checked" name="up" ></td>' +
        '<td><input style="margin-left: 35%;" type="checkbox" checked="checked" name="down" ></td>' +
        '<td><button type="button" onclick="addStoreConf($(this))">增加</button></td>' +
        '</tr>';

    kc_config_table.children('tbody').html(tr);
    kc_config_table.children('tfoot').html(ftr);
}

/**
 * 页面获取授权
 */
;!function () {

    var html = '<label>授权用户：<input id="store_auth_user" value="" ></label><br/>' +
        '<label>授权密码：<input id="store_auth_pass" value="" ></label>';

    layer.confirm(html, {
        btn: ['确定','取消']
    }, function(){
        var user = document.getElementById('store_auth_user').value;
        var pass = document.getElementById('store_auth_pass').value;
        if (!user || !pass) {
            layer.msg('未获取门店授权', {icon: 2});
        } else {
            layer.msg('数据加载中', {icon: 1});
            var tbody = $('#kc_config_table').children('tbody');
            couchDB.getStoreConf(user, pass, function (data) {
                renderTbody(data);
            })
        }
    }, function(){
        layer.msg('未获取门店授权', {icon: 2});
    });
}();