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
   ```
   cd kc/nodekc
   node index.js http://127.0.0.1:5984
   ```
 * Use KC UI
   
   Open http://127.0.0.1:5984/orders/_design/kc/index.html


##Production deployment of KC
 * Configuration of CouchDB
 * Configuration of RabbitMQ
 * How to update KC code

##Architecture of KC
 * Database design
 * Communication with other software module e.g. KP/POS/KS/CAP etc.
 * Share configuration with other software module
 * Synchronize data with OC
   * Send data to OC
   * Receive data from OC 
 * Resolve conflicting documents
