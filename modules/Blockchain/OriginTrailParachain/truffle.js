require('dotenv').config({ path: `${__dirname}/../../../.env` });
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const WalletProvider = require('@truffle/hdwallet-provider');

const privateKey = process.env.PARACHAIN_PRIVATE_KEY;
const rpc_endpoint = process.env.PARACHAIN_ACCESS_KEY;
const chain_id = process.env.PARACHAIN_CHAIN_ID;

module.exports = {
    compilers: {
        solc: {
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
            },
        },
    },

    networks: {
        development: {
            host: 'localhost',
            port: 8545,
            gas: 4000000,
            network_id: '*', // Match any network id
        },

        ganache: {
            host: 'localhost',
            port: 7545,
            gas: 6000000,
            network_id: '5777',
        },

        test: {
            host: 'localhost',
            port: 7545,
            gas: 6000000,
            network_id: '5777',
        },

        contracts: {
            provider: () => new WalletProvider([privateKey], rpc_endpoint),
            network_id: 4,
            gasPrice: 1,
            gas: 6000000, // Gas limit used for deploys
            skipDryRun: true,
        },

        testnet: {
            provider: () => new WalletProvider([privateKey], rpc_endpoint),
            network_id: chain_id,
            gasPrice: 100000000,
            gas: 8000000, // Gas limit used for deploys
            skipDryRun: true,
        },

        updateContracts: {
            provider: () => new WalletProvider([privateKey], rpc_endpoint),
            network_id: chain_id,
            gasPrice: 1,
            gas: 6000000, // Gas limit used for deploys
            skipDryRun: true,
        },

        token: {
            provider: () => new WalletProvider([privateKey], rpc_endpoint),
            network_id: 100,
            gas: 1700000, // Gas limit used for deploys
            gasPrice: 1000000000,
            websockets: false,
            skipDryRun: true,
        },
    },
};
