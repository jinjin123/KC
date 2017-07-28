# spark-opp kc 安装部署
## spark-opp 代码部署
* git clone -b zfm_kc git@gitlab.com:Sparkpad/spark-opp.git
* cd spark-opp
* docker pull zfming/node-pm2:latest
* docker run --name sparkpad-opp -v spark-opp:/app -p 3000:3000 -d zfming/node-pm2:latest
* docker exec -it sparkpad-opp npm install
* docker exec -it sparkpad-opp pm2 restart opp

## couchDB docker 安装
* docker pull klaemo/couchdb:2.0.0
* docker run --name sparkpad-couchdb -p 5984:5984 -d klaemo/couchdb:2.0.0

## couchDB 经理机安装
* 下载 [couchdb-2.0.0.2.msi](https://dl.bintray.com/apache/couchdb/win/2.0.0.2/couchdb-2.0.0.2.msi)
* 点击安装即可
* 访问[http://localhost:5984/_utils](http://localhost:5984/_utils)配置管理员账号
* 访问[http://localhost:5984/_utils/#_config/nonode@nohost](http://localhost:5984/_utils/#_config/nonode@nohost) 增加配置`chttpd（bind_address: 0.0.0.0）`、`couch_httpd_auth（require_valid_user:true）`
* 访问[http://localhost:5984/_utils/#_config/nonode@nohost/cors](http://localhost:5984/_utils/#_config/nonode@nohost/cors) 点击`enable cors`将云端的couchDB服务地址添加到允许列表

## 配置信息注册
* 测试环境访问[http://kc.sparkpad-dev.com](http://kc.sparkpad-dev.com)
* 选择服务配置，注册门店数据库配置信息
* 选择门店配置，添加数据同步配置信息（授权密码是门店couchDB的用户名密码）
* 注意：配置同步关系的云端地址不带`http://`（如测试地址：couchdb-cloud.sparkpad-dev.com）