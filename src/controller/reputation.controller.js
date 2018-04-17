const ReputationModel = require('../DB/reputation.mongo')
const SettingsController = require('./settings.controller')

class ReputationController {
  async addReputation (userId, botId, accountId, targetUserId) {
    let sourceUser = await this._getReputationUser(userId, botId, accountId, true)
    const targetUser = await this._getReputationUser(targetUserId, botId, accountId, true)
    const settings = await SettingsController.getSettings(accountId)
    if (!this._checkCooldown(sourceUser, settings)) {
      return {code: 1, message: 'The user used all of his reputations.', user: sourceUser}
    }
    sourceUser = this._removeOldCooldowns(sourceUser, settings)
    targetUser.givenReputation = this._checkGivenReputation(targetUser)
    const reputationLimits = this._checkReputationLimits(targetUser, settings)
    if (reputationLimits.maximumReputationReceivedDay || reputationLimits.maximumReputation) {
      return this._returnReputationLimits(reputationLimits, targetUser, settings)
    }
    await this._increaseReputation(targetUser)
    await this._addCooldown(sourceUser)
    return {code: 0, message: 'Successfully gave one reputation to the targetUser', sourceUser, targetUser}
  }

  async getReputation (userId, botId, accountId) {
    const user = await this._getReputationUser(userId, botId, accountId)
    if (!user) {
      return {
        user: this._constructUser(userId, botId, accountId),
        date: new Date(),
        timeRemaining: 0
      }
    }
    return {user, date: new Date(Date.now())}
  }

  async getLeaderboard (botId, accountId) {
    return ReputationModel.find({accountId, botId})
      .limit(50)
      .sort({reputation: -1})
      .exec()
  }

  async resetReputation (userId, botId, accountId, resetCooldown = false) {
    let user = await this._getReputationUser(userId, botId, accountId)
    if (!user) {
      user = this._constructUser(userId, botId, accountId)
      return {user}
    }
    user = await this._setReputation(user, 0, resetCooldown ? [] : undefined)
    return {user}
  }

  async increaseReputation (userId, botId, accountId, increaseBy) {
    let user = await this._getReputationUser(userId, botId, accountId, true)
    user = await this._setReputation(user, user.reputation += increaseBy, user.cooldown)
    return {user}
  }

  async decreaseReputation (userId, botId, accountId, increaseBy) {
    let user = await this._getReputationUser(userId, botId, accountId, true)
    user = await this._setReputation(user, user.reputation -= increaseBy, user.cooldown)
    return {user}
  }

  async _setReputation (user, reputation, cooldown) {
    user.cooldown = cooldown || user.cooldown
    await ReputationModel.update({
      userId: user.userId,
      botId: user.botId,
      accountId: user.accountId
    }, {$set: {reputation, cooldown: user.cooldown}})
    user.reputation = reputation
    return user
  }

  _constructUser (userId, botId, accountId) {
    return {
      userId,
      botId,
      accountId,
      reputation: 0,
      cooldown: [],
      givenReputation: []
    }
  }

  async _addCooldown (sourceUser) {
    sourceUser.cooldown.push(new Date(Date.now()))
    await ReputationModel.update({
      userId: sourceUser.userId,
      botId: sourceUser.botId,
      accountId: sourceUser.accountId
    }, {$set: {cooldown: sourceUser.cooldown}})
    return sourceUser
  }

  async _increaseReputation (targetUser) {
    targetUser.givenReputation.push(new Date(Date.now()))
    targetUser.reputation += 1
    await ReputationModel.update({
      userId: targetUser.userId,
      botId: targetUser.botId,
      accountId: targetUser.accountId
    }, {$set: {reputation: targetUser.reputation, givenReputation: targetUser.givenReputation}})
    return targetUser
  }

  _checkGivenReputation (user) {
    for (const givenReputation of user.givenReputation) {
      if (givenReputation.getTime() + 1000 * 60 * 60 * 24 < Date.now()) {
        const index = user.givenReputation.indexOf(givenReputation)
        user.givenReputation.splice(index)
      }
    }
    return user.givenReputation
  }

  _returnReputationLimits (reputationLimits, targetUser, settings) {
    if (reputationLimits.maximumReputationReceivedDay) {
      return {
        code: 2,
        message: 'The user received the maximum amount of reputation for today',
        maximumReputationReceivedDay: settings.maximumReputationReceivedDay,
        user: targetUser
      }
    } else {
      return {
        code: 3,
        message: 'The user reached the maximum possible amount of reputation',
        maximumReputation: settings.maximumReputation,
        user: targetUser
      }
    }
  }

  _checkCooldown (user, settings) {
    if (user.cooldown.length < settings.reputationPerDay) {
      return true
    }
    for (const cooldown of user.cooldown) {
      if (cooldown.getTime() + settings.reputationCooldown.getTime() < Date.now()) {
        return true
      }
    }
    return false
  }

  _checkReputationLimits (user, settings) {
    const limits = {maximumReputation: false, maximumReputationReceivedDay: false}
    if (settings.maximumReputation !== 0) {
      limits.maximumReputation = user.reputation >= settings.maximumReputation
    }
    if (settings.maximumReputationReceivedDay !== 0) {
      limits.maximumReputationReceivedDay = user.givenReputation.length >= settings.maximumReputation
    }
    return limits
  }

  _removeOldCooldowns (user, settings) {
    for (const cooldown of user.cooldown) {
      if (cooldown.getTime() + settings.reputationCooldown.getTime() < Date.now()) {
        const index = user.cooldown.indexOf(cooldown)
        user.cooldown.splice(index)
      }
    }
    return user
  }

  async _getReputationUser (userId, botId, accountId, createIfNotExist = false) {
    let user = await ReputationModel.findOne({userId, botId, accountId}, {_id: 0, __v: 0})
      .lean()
      .exec()
    if (!user && createIfNotExist) {
      user = await this._createReputationUser(userId, botId, accountId)
    }
    return user
  }

  async _createReputationUser (userId, botId, accountId) {
    const user = new ReputationModel({
      userId,
      botId,
      accountId
    })
    await user.save()
    return user
  }
}

module.exports = ReputationController
