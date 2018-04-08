const Network = require('./modules/Network');
const Utilities = require('./modules/Utilities');
const GraphStorage = require('./modules/Database/GraphStorage');
const Graph = require('./modules/Graph');
const SystemStorage = require('./modules/Database/SystemStorage');
const Blockchain = require('./modules/Blockchain');
const deasync = require('deasync-promise');
const MerkleTree = require('./modules/Merkle');
const restify = require('restify');
var models = require('./models');
const Storage = require('./modules/Storage');
const config = require('./modules/Config');

const log = Utilities.getLogger();


/**
 * Main node object
 */

class OTNode {
    /**
     * OriginTrail node system bootstrap function
     */
    bootstrap() {
        // sync models
        Storage.models = deasync(models.sequelize.sync()).models;

        // Loading config data
        try {
            deasync(Utilities.loadConfig());
            log.info('Loaded system config');
        } catch (err) {
            console.log(err);
        }

        let selectedDatabase;
        // Loading selected graph database data
        try {
            selectedDatabase = deasync(Utilities.loadSelectedDatabaseInfo());
            log.info('Loaded selected database data');
        } catch (err) {
            console.log(err);
        }

        let selectedBlockchain;
        // Loading selected graph database data
        try {
            selectedBlockchain = deasync(Utilities.loadSelectedBlockchainInfo());
            log.info(`Loaded selected blockchain network ${selectedBlockchain.blockchain_title}`);
        } catch (err) {
            console.log(err);
        }

        this.graphDB = new GraphStorage(selectedDatabase);
        this.blockchain = new Blockchain(selectedBlockchain);

        // Connecting to graph database
        try {
            deasync(this.graphDB.connect());
            log.info(`Connected to graph database: ${this.graphDB.identify()}`);
            // TODO: System storage fix
            this.graph = new Graph(this.graphDB, new SystemStorage());
        } catch (err) {
            console.log(err);
        }

        // Starting the kademlia
        const network = new Network();
        network.start().then((res) => {
            // console.log(res);
        }).catch((e) => {
            // console.log(e)
        });
    }
}

console.log('===========================================');
console.log('            OriginTrail Node               ');
console.log('===========================================');

const otNode = new OTNode();
otNode.bootstrap();

// otNode.blockchain.increaseApproval(5).then((response) => {
//     log.info(response);
// }).catch((err) => {
//     console.log(err);
// });
//
//
// const server = restify.createServer({
//     name: 'OriginTrail RPC server',
//     version: '0.5.0',
// });
//
// server.listen(otNode.config.node_rpc_port, () => {
//     log.info('%s listening at %s', server.name, server.url);
// });

/*
const leaves = ['A', 'B', 'C', 'D', 'E'];

const tree = new MerkleTree(leaves);

console.log(tree.levels);
// console.log(tree.levels);
// console.log();
const h1 = Utilities.sha3(1);
const h2 = Utilities.sha3(2);
const h3 = Utilities.sha3(3); // !!!
const h4 = Utilities.sha3(4);
const h5 = Utilities.sha3(5);

const h12 = Utilities.sha3(h1,h2);
const h34 = Utilities.sha3(h3,h4);
const h55 = Utilities.sha3(h5,h5);

const h1234 = Utilities.sha3(h12, h34);
const h5555 = Utilities.sha3(h55, h55);

console.log(tree.verifyProof(proof, 2, 1));

const proof = tree.createProof(1);
console.log(proof);
console.log(tree.verifyProof(proof, 'B', 1));
console.log(tree.getRoot().toString('hex'));
*/
