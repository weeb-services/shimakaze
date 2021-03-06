const mongoose = require('mongoose')
const settingsSchema = mongoose.Schema({
  accountId: String,
  reputationPerDay: {type: Number, default: 2},
  maximumReputation: {type: Number, default: 0},
  maximumReputationReceivedDay: {type: Number, default: 0},
  reputationCooldown: {type: Date, default: new Date(1000 * 60 * 60 * 24)}
})
const settingsModel = mongoose.model('settings', settingsSchema)
module.exports = settingsModel
