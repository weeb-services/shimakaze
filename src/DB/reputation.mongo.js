const mongoose = require('mongoose')
const reputationSchema = mongoose.Schema({
  botId: String,
  userId: String,
  accountId: String,
  reputation: {type: Number, default: 0},
  cooldown: {type: Array, default: []},
  givenReputation: {type: Array, default: []}
})
const reputationModel = mongoose.model('reputations', reputationSchema)
module.exports = reputationModel
