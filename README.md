##Getting started with KC
 * Install couchapp
   Please refer to [official documentation](https://github.com/couchapp/couchapp)
 * Get KC source code
   `git clone https://git.coding.net/mshen/KC-with-CouchDB-and-RabbitMQ.git kc`
 * Build docker image of CouchDB and RabbitMQ
   ```
   cd kc/docker/couchdb
   docker build -t cdb .
   cd kc/docker/rabbitmq
   docker build -t rmq .
   ```
 * Start docker containers
   
 * Deploy KC to CouchDB
   
 * Start KC
 * Use KC UI


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
