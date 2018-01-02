'use strict';
const BaseRouter = require('wapi-core').BaseRouter;
const HTTPCodes = require('wapi-core').Constants.HTTPCodes;
const ReputationController = require('../controller/reputation.controller');
const validator = require('../validator/index.js');
const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});
const reputationUtils = require('../utils');

class ReputationRouter extends BaseRouter {
    constructor() {
        super();
        this.repController = new ReputationController();
        this.get('/:bot_id/leaderboard', async (req) => {
            let users = await this.repController.getLeaderboard(req.params.bot_id, req.account.id);
            return {users};
        });
        this.get('/:bot_id/:user_id', async (req) => {
            let reputationUser = await this.repController.getReputation(req.params.user_id, req.params.bot_id, req.account.id);
            let settings = await this.repController.getSettings(req.account.id);
            reputationUser.user.availableReputations = reputationUtils.getAvailableReputations(reputationUser.user, settings, Date.now());
            reputationUser.user.nextAvailableReputations = reputationUtils.getNextAvailableReputation(reputationUser.user);
            return reputationUser;
        });
        this.post('/:bot_id/:user_id', async (req) => {
            let requestValidator = validator.getValidator('addReputation');
            let bodyCheck = requestValidator({body: req.body});
            if (!bodyCheck) {
                return {
                    status: HTTPCodes.BAD_REQUEST,
                    errors: requestValidator.errors,
                    message: ajv.errorsText(requestValidator.errors),
                    in: 'body'
                };
            }
            if (req.body.source_user === req.params.user_id) {
                return {status: HTTPCodes.BAD_REQUEST, message: 'the source and the target user id may not be equal'};
            }
            let repResult = await this.repController.addReputation(req.body.source_user, req.params.bot_id, req.account.id, req.params.user_id);
            switch (repResult.code) {
                case 0:
                    return Object.assign({status: HTTPCodes.OK, date: new Date(Date.now())}, repResult);
                case 1:
                case 2:
                case 3:
                    return Object.assign({status: HTTPCodes.FORBIDDEN, date: new Date(Date.now())}, repResult);
                default:
                    break;
            }
        });
        this.post('/:bot_id/:user_id/reset', async (req) => {
            return this.repController.resetReputation(req.params.user_id, req.params.bot_id, req.account.id, req.query.cooldown);
        });
        this.post('/:bot_id/:user_id/increase', async (req) => {
            let requestValidator = validator.getValidator('increaseReputation');
            let bodyCheck = requestValidator({body: req.body});
            if (!bodyCheck) {
                return {
                    status: HTTPCodes.BAD_REQUEST,
                    errors: requestValidator.errors,
                    message: ajv.errorsText(requestValidator.errors),
                    in: 'body'
                };
            }
            return await this.repController.increaseReputation(req.params.user_id, req.params.bot_id, req.account.id, req.body.increase);
        });
        this.post('/:bot_id/:user_id/decrease', async (req) => {
            let requestValidator = validator.getValidator('decreaseReputation');
            let bodyCheck = requestValidator({body: req.body});
            if (!bodyCheck) {
                return {
                    status: HTTPCodes.BAD_REQUEST,
                    errors: requestValidator.errors,
                    message: ajv.errorsText(requestValidator.errors),
                    in: 'body'
                };
            }
            return await this.repController.decreaseReputation(req.params.user_id, req.params.bot_id, req.account.id, req.body.decrease);
        });
    }
}

module.exports = ReputationRouter;
