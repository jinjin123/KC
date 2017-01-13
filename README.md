##Getting started with KC
 * Install couchapp

   Please refer to [official documentation](https://github.com/couchapp/couchapp)
 * Get KC source code
   ```
   git clone https://git.coding.net/mshen/KC-with-CouchDB-and-RabbitMQ.git kc
   ```
 * Build docker image of CouchDB and RabbitMQ
   ```
   cd kc/docker/couchdb
   docker build -t cdb .
   cd kc/docker/rabbitmq
   docker build -t rmq .
   ```
 * Start docker containers
   ```
   cd kc/docker
   docker-compose -f rmq-cdb.yml up -d
   ```
 * Deploy KC to CouchDB
   ```
   couchapp push http://127.0.0.1:5984/orders
   ```
 * Start KC
   
   For those running nodejs 6.6.0 or newer
   ```
   cd kc/nodekc
   node index.js http://127.0.0.1:5984
   ```
   For those running nodejs lower than 6.6.0
   ```
   cd kc/nodekc
   rm -rf node_modules
   npm install
   node index.js http://127.0.0.1:5984   
   ```
 * Use KC UI
   
   Use your browser to open http://127.0.0.1:5984/orders/_design/kc/index.html. This is the WEB page of KC hosted in CouchDB. 
   The WEB page provides functionalities that require user interaction. The following functionalities could be accessed from 
   that page:
   * Set store-id, this is the unique ID of a store. Setting this field will tell KC which store it is working in.
   * Set if KC should resolve conflicting orders automatically. If this flag is true, and there are multiple revisions of data 
     for a single order, KC will pick the revision with the highest orderstatus and synchronize it to OC, other revisions will be 
     deleted automatically.
   * Go to CouchDB management page.
   * Start the KC daemon in browser to synchronize order between KC and OC. The daemon could run in browser as well as nodejs.
   * List the current configuration before variable substitution
   * List the current configuration after variable substitution
   * List the conflicting orders
   * List orders that have been synchronized to OC
   * List orders that have NOT been synchronized to OC
   * List orders that failed to synchronize to OC
   * Re-synchronize failed orders to OC
   * Delete all orders in CouchDB
   * Delete orders that is older than a month
   * Compact database to release disk space
   * Copy design documents to/from CouchDB servers that are listed in [kc.target.json](http://127.0.0.1:5984/orders/_design/kc/kc.target.json)
   * Retrieve order list from OC
   * Retrieve order list from POS
   * Get order information from OC by order ID
   * Get order information from KC by order ID and revision number
   * Display the current status of STOMP connection

##Production deployment of KC
 * Configuration of CouchDB
   * To facilitate the installation on x86 platform, the version of CouchDB is **1.6.1** 
   * CORS setting of CouchDB
     ```
     [httpd]
     enable_cors = true
     [cors]
     origins = *
     credentials = true
     methods = GET, PUT, POST, HEAD, DELETE
     headers = accept, authorization, content-type, origin, referer, x-csrf-token
     ```
   * Authentication of administrator
     ```
     [admins]
     ymeng = 111111
     ```
   * Virtual hosts
     ```
     [vhosts]
     :ddoc.zkf.com:5984=/orders/_design/:ddoc/index.html
     ```
   * Auto-Compaction
     ```
     [compactions]
     _default = [{db_fragmentation, "70%"}, {view_fragmentation, "60%"}, {from, "23:00"}, {to, "04:00"}]
     ```
   * Disable delayed commit
     ```
     [couchdb]
     delayed_commits = false
     ```
 * Configuration of RabbitMQ

   * Enable guest user to access management UI remotely
     ```
     {loopback_users, []},
     ```
   * Enable additional plugins
     * rabbitmq_management
     * rabbitmq_federation
     * rabbitmq_federation_management
     * rabbitmq_shovel
     * rabbitmq_shovel_management
     * rabbitmq_web_stomp
   * Expose additional ports
     > 15671 15672 15673 15674 61613 61614

 * How to update KC code
   **?????**

##Architecture of KC
* Database design  
  The 'orders' database is for storing all orders of a store. And the design documents of 'orders' are structured as 
  > views
  ├── conflicts
  │   └── map.js
  ├── order_status
  │   └── map.js
  ├── status
  │   └── map.js
  ├── sync_status
  │   └── map.js
  └── timestamp
      └── map.js
  

* Communication with other software module e.g. KP/POS/KS/CAP etc.
* Share configuration with other software module
* Synchronize data with OC
  * Send data to OC
  * Receive data from OC 
* Resolve conflicting documents
