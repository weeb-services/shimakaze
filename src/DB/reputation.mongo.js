let mongoose = require('mongoose');
let reputationSchema = mongoose.Schema({
    botId: String,
    userId: String,
    accountId: String,
    reputation: {type: Number, default: 0},
    cooldown: {type: Array, default: []},
    givenReputation: {type: Array, default: []}
});
let reputationModel = mongoose.model('reputations', reputationSchema);
module.exports = reputationModel;
