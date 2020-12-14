const pjson = require('../../package.json');
const RestAPIValidator = require('../validator/rest-api-validator');
const Utilities = require('../Utilities');
const Models = require('../../models');

class RestAPIServiceV2 {
    constructor(ctx) {
        this.ctx = ctx;
        this.config = ctx.config;
        this.logger = ctx.logger;
        this.apiUtilities = ctx.apiUtilities;
        this.emitter = ctx.emitter;
        this.commandExecutor = ctx.commandExecutor;
        this.epcisOtJsonTranspiler = ctx.epcisOtJsonTranspiler;
        this.wotOtJsonTranspiler = ctx.wotOtJsonTranspiler;

        this.dcController = ctx.dcController;
        this.dhController = ctx.dhController;
        this.dvController = ctx.dvController;
        this.infoController = ctx.infoController;
        this.didController = ctx.didController;

        this.exportController = ctx.exportController;
        this.remoteControl = ctx.remoteControl;

        this.graphStorage = ctx.graphStorage;
        this.importService = ctx.importService;

        this.version_id = 'v2.0';
        this.graphStorage = ctx.graphStorage;
    }

    /**
     * API Routes
     */
    _exposeAPIRoutes(server) {
        const {
            transport, emitter, blockchain, web3, config,
        } = this.ctx;

        server.get(`/api/${this.version_id}/info`, async (req, res) => {
            await this.infoController.getNodeInfo(req, res);
        });

        server.post(`/api/${this.version_id}/import`, async (req, res) => {
            await this.dcController.importDataset(req, res);
        });

        server.get(`/api/${this.version_id}/import/result/:handler_id`, async (req, res) => {
            await this._checkForHandlerStatus(req, res);
        });

        server.post(`/api/${this.version_id}/replicate`, async (req, res) => {
            await this._replicateDataset(req, res);
        });

        server.get(`/api/${this.version_id}/replicate/result/:handler_id`, async (req, res) => {
            await this._checkForReplicationHandlerStatus(req, res);
        });

        server.post(`/api/${this.version_id}/export`, async (req, res) => {
            await this.exportController.exportDataset(req, res);
        });

        server.get(`/api/${this.version_id}/export/result/:handler_id`, async (req, res) => {
            await this.exportController.checkForHandlerStatus(req, res);
        });

        server.get(`/api/${this.version_id}/standards`, async (req, res) => {
            this.dcController.getStandards(req, res);
        });

        server.get(`/api/${this.version_id}/get_element_issuer_identity/:element_id`, async (req, res) => {
            await this._getElementIssuerIdentity(req, res);
        });

        server.get(`/api/${this.version_id}/get_connection_types/:standard_id`, async (req, res) => {
            await this._getConnectionTypes(req, res);
        });

        server.get(`/api/${this.version_id}/get_dataset_info/:dataset_id`, async (req, res) => {
            await this.infoController.getDatasetInfo(req, res);
        });

        server.post(`/api/${this.version_id}/trail`, async (req, res) => {
            await this._getTrail(req, res);
        });

        server.post(`/api/${this.version_id}/get_merkle_proofs`, async (req, res) => {
            await this._getMerkleProofs(req, res);
        });

        server.post(`/api/${this.version_id}/network/query`, async (req, res) => {
            await this._networkQuery(req, res);
        });

        server.get(`/api/${this.version_id}/network/query/result/:query_id`, async (req, res) => {
            await this._networkQueryStatus(req, res);
        });

        server.get(`/api/${this.version_id}/network/query/responses/:query_id`, async (req, res) => {
            await this._networkQueryResponses(req, res);
        });

        server.post(`/api/${this.version_id}/network/read`, async (req, res) => {
            await this._readNetwork(req, res);
        });

        server.get(`/api/${this.version_id}/network/read/result/:handler_id`, async (req, res) => {
            await this._checkForHandlerStatus(req, res);
        });

        server.post(`/api/${this.version_id}/network/permissioned_data/read`, async (req, res) => {
            await this.dvController.handlePermissionedDataReadRequest(req, res);
        });

        server.get(`/api/${this.version_id}/network/permissioned_data/read/result/:handler_id`, async (req, res) => {
            await this._checkForHandlerStatus(req, res);
        });

        server.post(`/api/${this.version_id}/permissioned_data/whitelist_viewer`, async (req, res) => {
            await this.dhController.whitelistViewer(req, res);
        });

        server.post(`/api/${this.version_id}/permissioned_data/remove`, async (req, res) => {
            await this.dcController.removePermissionedData(req, res);
        });

        server.post(`/api/${this.version_id}/network/read_export`, async (req, res) => {
            await this.dvController.handleDataReadExportRequest(req, res);
        });

        server.get(`/api/${this.version_id}/network/read_export/result/:handler_id`, async (req, res) => {
            await this.exportController.checkForHandlerStatus(req, res);
        });

        server.post(`/api/${this.version_id}/challenges`, async (req, res) => {
            await this._getChallenges(req, res);
        });

        if (process.env.NODE_ENV !== 'mainnet') {
            server.post(`/api/${this.version_id}/network/permissioned_data/purchase`, async (req, res) => {
                await this.dvController.sendNetworkPurchase(req, res);
            });

            server.get(`/api/${this.version_id}/network/permissioned_data/purchase/result/:handler_id`, async (req, res) => {
                await this._checkForHandlerStatus(req, res);
            });
            server.get(`/api/${this.version_id}/permissioned_data/available`, async (req, res) => {
                await this.dvController.getPermissionedDataAvailable(req, res);
            });


            server.get(`/api/${this.version_id}/permissioned_data/owned`, async (req, res) => {
                await this.dcController.getPermissionedDataOwned(req, res);
            });

            server.post(`/api/${this.version_id}/network/permissioned_data/get_price`, async (req, res) => {
                await this.dvController.getPermissionedDataPrice(req, res);
            });

            server.post(`/api/${this.version_id}/permissioned_data/update_price`, async (req, res) => {
                await this.dcController.updatePermissionedDataPrice(req, res);
            });

            server.get(`/api/${this.version_id}/network/permissioned_data/get_price/result/:handler_id`, async (req, res) => {
                await this._checkForHandlerStatus(req, res);
            });

            server.get(`/api/${this.version_id}/permissioned_data/trading_info/:type`, async (req, res) => {
                await this.dvController.getTradingData(req, res);
            });
        }

        server.post(`/api/${this.version_id}/staging_data/create`, async (req, res) => {
            await this.dcController.handleStagingDataCreate(req, res);
        });

        server.post(`/api/${this.version_id}/staging_data/remove`, async (req, res) => {
            await this.dcController.handleStagingDataRemove(req, res);
        });

        server.post(`/api/${this.version_id}/staging_data/publish`, async (req, res) => {
            await this.dcController.handleStagingDataPublish(req, res);
        });

        server.post(`/api/${this.version_id}/did/resolve`, async (req, res, next) => {
            await this.didController.resolve(req, res);
        });

        server.post(`/api/${this.version_id}/did/authenticate`, async (req, res, next) => {
            await this.didController.authenticate(req, res);
        });

        server.post(`/api/${this.version_id}/query/local`, async (req, res, next) => {
            await this.dcController.queryLocal(req, res);
        });

        /** Network related routes */
        server.get(`/api/${this.version_id}/network/get-contact/:node_id`, async (req, res) => {
            const nodeId = req.params.node_id;
            this.logger.api(`Get contact node ID ${nodeId}`);

            const result = await transport.getContact(nodeId);
            const body = {};

            if (result) {
                Object.assign(body, result);
            }
            res.status(200);
            res.send(body);
        });

        server.get(`/api/${this.version_id}/network/find/:node_id`, async (req, res) => {
            const nodeId = req.params.node_id;
            this.logger.api(`Find node ID ${nodeId}`);

            const result = await transport.findNode(nodeId);
            const body = {};

            if (result) {
                Object.assign(body, result);
            }
            res.status(200);
            res.send(body);
        });

        /**
         * Temporary route used for HTTP network prototype
         */
        server.post(`/api/${this.version_id}/network/send`, (req, res) => {
            this.logger.api('P2P request received');

            const { type } = req.body;
            emitter.emit(type, req, res);
        });

        server.get(`/api/${this.version_id}/query/local/import/:data_set_id`, (req, res) => {
            this.logger.api('GET: Local import request received.');

            if (!req.params.data_set_id) {
                res.status(400);
                res.send({
                    message: 'Param required.',
                });
                return;
            }

            emitter.emit('api-query-local-import', {
                data_set_id: req.params.data_set_id,
                format: ((req.query && req.query.format) || 'otjson'),
                encryption: req.query.encryption,
                request: req,
                response: res,
            });
        });


        server.get(`/api/${this.version_id}/consensus/:sender_id`, (req, res) => {
            this.logger.api('GET: Consensus check events request received.');

            if (req.params.sender_id == null) {
                res.status(400);
                res.send({ message: 'Bad request' });
            }

            emitter.emit('api-consensus-events', {
                sender_id: req.params.sender_id,
                response: res,
            });
        });

        /**
         * Payout route
         * @param Query params: data_set_id
         */
        server.get(`/api/${this.version_id}/payout`, (req, res) => {
            this.logger.api('GET: Payout request received.');

            if (!req.query.offer_id) {
                res.status(400);
                res.send({
                    message: 'Param offer_id is required.',
                });
                return;
            }

            emitter.emit('api-payout', {
                offerId: req.query.offer_id,
                response: res,
            });
        });

        /** Get root hash for provided data query
         * @param Query params: data_set_id
         */
        server.get(`/api/${this.version_id}/fingerprint/:dataset_id`, (req, res) => {
            this.dvController.handleGetFingerprint(req, res);
        });

        server.get(`/api/${this.version_id}/import_info`, async (req, res) => {
            this.logger.api('GET: import_info.');

            const queryObject = req.query;
            if (queryObject.data_set_id == null) {
                res.send({ status: 400, message: 'Missing parameter!', data: [] });
                return;
            }

            this.emitter.emit('api-import-info', {
                dataSetId: queryObject.data_set_id,
                responseFormat: queryObject.format || 'otjson',
                response: res,
            });
        });

        server.get(`/api/${this.version_id}/balance`, async (req, res) => {
            this.logger.api('Get balance.');

            try {
                const humanReadable = req.query.humanReadable === 'true';

                const walletEthBalance = await web3.eth.getBalance(config.node_wallet);
                const walletTokenBalance = await Utilities.getTracTokenBalance(
                    web3,
                    config.node_wallet,
                    blockchain.getTokenContractAddress(),
                    false,
                );
                const profile = await blockchain.getProfile(config.erc725Identity);
                const profileMinimalStake = await blockchain.getProfileMinimumStake();

                const body = {
                    wallet: {
                        address: config.node_wallet,
                        ethBalance: humanReadable ? web3.utils.fromWei(walletEthBalance, 'ether') : walletEthBalance,
                        tokenBalance: humanReadable ? web3.utils.fromWei(walletTokenBalance, 'ether') : walletTokenBalance,
                    },
                    profile: {
                        staked: humanReadable ? web3.utils.fromWei(profile.stake, 'ether') : profile.stake,
                        reserved: humanReadable ? web3.utils.fromWei(profile.stakeReserved, 'ether') : profile.stakeReserved,
                        minimalStake: humanReadable ? web3.utils.fromWei(profileMinimalStake, 'ether') : profileMinimalStake,
                    },
                };

                res.status(200);
                res.send(body);
            } catch (error) {
                this.logger.error(`Failed to get balance. ${error.message}.`);
                res.status(503);
                res.send({});
            }
        });

        server.get(`/api/${this.version_id}/imports_info`, (req, res) => {
            this.logger.api('GET: List imports request received.');

            emitter.emit('api-imports-info', {
                response: res,
            });
        });

        server.get(`/api/${this.version_id}/dump/rt`, (req, res) => {
            this.logger.api('Dumping routing table');
            const message = transport.dumpContacts();

            res.status(200);
            res.send({
                message,
            });
        });
    }

    async _getTrail(req, res) {
        this.logger.api('POST: Trail request received.');

        await this.dhController.getTrail(req, res);
    }

    async _getMerkleProofs(req, res) {
        this.logger.api('POST: Get Merkle proofs request received.');

        if (req.body === undefined) {
            res.status(400);
            res.send({
                message: 'Bad request',
            });
            return;
        }

        if (req.body.object_ids === undefined ||
            req.body.dataset_id === undefined) {
            res.status(400);
            res.send({
                message: 'Bad request',
            });
            return;
        }

        const { object_ids, dataset_id } = req.body;

        const response =
            await this.importService.getMerkleProofs(Utilities.arrayze(object_ids), dataset_id);

        res.status(200);
        res.send(response);
    }

    async _networkQuery(req, res) {
        this.logger.api('POST: Network query request received.');

        let error = RestAPIValidator.validateBodyRequired(req.body);
        if (error) {
            res.status(400);
            res.send({
                message: error.message,
            });
            return;
        }

        const { query } = req.body;
        error = RestAPIValidator.validateSearchQuery(query);
        if (error) {
            res.status(400);
            res.send({
                message: error.message,
            });
            return;
        }

        this.logger.info('Network-query handling triggered.');

        const queryId = await this.dvController.queryNetwork(query, res);

        if (queryId) {
            res.status(200);
            res.send({
                query_id: queryId,
            });
        }
    }

    async _networkQueryStatus(req, res) {
        this.logger.api('GET: Query for status request received.');

        if (!req.params.query_id) {
            res.status(400);
            res.send({
                message: 'Missing Query ID parameter.',
            });
            return;
        }

        await this.dvController.handleNetworkQueryStatus(req.params.query_id, res);
    }

    async _networkQueryResponses(req, res) {
        this.logger.api('GET: Local query responses request received.');

        if (!req.params.query_id) {
            res.status(400);
            res.send({
                message: 'Param query_id is required.',
            });
            return;
        }

        await this.dvController.getNetworkQueryResponses(req.params.query_id, res);
    }

    async _readNetwork(req, res) {
        this.logger.api('POST: Network read request received.');

        if (req.body == null || req.body.reply_id == null
            || req.body.data_set_id == null) {
            res.status(400);
            res.send({ message: 'Params reply_id and data_set_id are required.' });
            return;
        }
        const { reply_id, data_set_id } = req.body;

        await this.dvController.handleDataReadRequest(data_set_id, reply_id, res);
    }

    async _checkForReplicationHandlerStatus(req, res) {
        const handler_object = await Models.handler_ids.findOne({
            where: {
                handler_id: req.params.handler_id,
            },
        });

        if (handler_object == null) {
            this.logger.info('Invalid request');
            res.status(404);
            res.send({
                message: 'Unable to find data with given parameters!',
            });
            return;
        }
        const handlerData = JSON.parse(handler_object.data);

        const offerData = {
            status: handlerData.status,
            holders: handlerData.holders,
        };
        const offer = await Models.offers.findOne({
            where: {
                [Models.Sequelize.Op.or]: [
                    {
                        offer_id: handlerData.offer_id,
                    },
                    {
                        id: handlerData.offer_id,
                    },
                ],
            },
        });
        if (offer) {
            offerData.number_of_replications = offer.number_of_replications;
            offerData.number_of_verified_replications = offer.number_of_verified_replications;
            offerData.trac_in_eth_used_for_price_calculation =
                offer.trac_in_eth_used_for_price_calculation;
            offerData.gas_price_used_for_price_calculation =
                offer.gas_price_used_for_price_calculation;
            offerData.price_factor_used_for_price_calculation =
                offer.price_factor_used_for_price_calculation;
            offerData.offer_create_transaction_hash = offer.transaction_hash;
            offerData.offer_finalize_transaction_hash = offer.offer_finalize_transaction_hash;
            offerData.offer_id = offer.offer_id;
            offerData.holding_time_in_minutes = offer.holding_time_in_minutes;
            offerData.token_amount_per_holder = offer.token_amount_per_holder;
            offerData.message = offer.message;
        }
        Object.keys(offerData).forEach(key => (offerData[key] == null) && delete offerData[key]);
        res.status(200);
        res.send({
            data: offerData,
            status: handler_object.status,
        });
    }

    async _checkForHandlerStatus(req, res) {
        const handler_object = await Models.handler_ids.findOne({
            where: {
                handler_id: req.params.handler_id,
            },
        });

        if (handler_object == null) {
            this.logger.info('Invalid request');
            res.status(404);
            res.send({
                message: 'Unable to find data with given parameters!',
            });
            return;
        }

        const { data, status } = handler_object;

        res.status(200);
        res.send({
            data: JSON.parse(data),
            status,
        });
    }

    async _getChallenges(req, res) {
        if (req.body === undefined) {
            res.status(400);
            res.send({
                message: 'Bad request',
            });
            return;
        }

        // Check if import type is valid
        if (req.body.startDate === undefined ||
            req.body.endDate === undefined) {
            res.status(400);
            res.send({
                message: 'Bad request startDate and endDate required!',
            });
            return;
        }

        const challenges = await Models.challenges.findAll({
            where: {
                start_time: {
                    [Models.Sequelize.Op.between]:
                        [(new Date(req.body.startDate)).getTime(),
                            (new Date(req.body.endDate)).getTime()],
                },
                status: {
                    [Models.Sequelize.Op.not]: 'PENDING',
                },
            },
            order: [
                ['start_time', 'ASC'],
            ],
        });
        const returnChallenges = [];
        challenges.forEach((challenge) => {
            const answered = !!challenge.answer;
            returnChallenges.push({
                offer_id: challenge.offer_id,
                start_time: challenge.start_time,
                status: challenge.status,
                answered,
            });
        });

        res.status(200);
        res.send(returnChallenges);
    }

    async _replicateDataset(req, res) {
        this.logger.api('POST: Replication of imported data request received.');

        this.dcController.handleReplicateRequest(req, res);
    }

    _getConnectionTypes(req, res) {
        const standard_id = req.params.standard_id.toLocaleLowerCase();
        if (standard_id === 'gs1') {
            res.status(200);
            res.send({ connection_types: this.epcisOtJsonTranspiler.getConnectionTypes() });
        } else if (standard_id === 'wot') {
            res.status(200);
            res.send({ connection_types: this.wotOtJsonTranspiler.getConnectionTypes() });
        } else {
            res.status(400);
            res.send({
                message: 'Invalid type request',
            });
        }
    }

    /**
     * Returns element issuer identity
     * @param req
     * @param res
     * @returns {Promise<void>}
     * @private
     */
    async _getElementIssuerIdentity(req, res) {
        this.logger.api('GET: Element issuer identity request received.');
        const elementId = req.params.element_id;
        if (!elementId) {
            res.status(400);
            res.send({
                message: 'Param element_id is required.',
            });
            return;
        }
        const result = await this.graphStorage.findIssuerIdentityForElementId(elementId);
        if (result && result.length > 0) {
            res.status(200);
            res.send(result);
        } else {
            res.status(400);
            res.send({
                message: 'Unable to find requested data',
            });
        }
    }
}


module.exports = RestAPIServiceV2;
