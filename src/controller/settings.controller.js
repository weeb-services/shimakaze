const SettingsModel = require('../DB/settings.mongo')
const defaultSettings = {
  reputationPerDay: 2,
  maximumReputation: 0,
  maximumReputationReceivedDay: 0,
  reputationCooldown: new Date(1000 * 60 * 60 * 24)
}

class SettingsController {
  static async getSettings (accountId) {
    const settings = await SettingsModel.findOne({accountId})
    if (!settings) {
      return Object.assign({}, defaultSettings)
    }
    return settings
  }

  static async updateSettings (accountId, updatedSettings) {
    updatedSettings = this._fixReputationCooldown(updatedSettings)
    updatedSettings = this._fillMissingFields(accountId, updatedSettings)
    console.log(updatedSettings)
    const settings = await SettingsModel.findOne({accountId})
    if (!settings) {
      await new SettingsModel(updatedSettings).save()
      return updatedSettings
    } else {
      await SettingsModel.update({accountId}, {$set: updatedSettings})
      return updatedSettings
    }
  }

  static _fixReputationCooldown (updatedSettings) {
    if (typeof updatedSettings.reputationCooldown === 'number') {
      updatedSettings.reputationCooldown = new Date(updatedSettings.reputationCooldown * 1000)
    }
    return updatedSettings
  }

  static _fillMissingFields (accountId, settings) {
    for (const key of Object.keys(defaultSettings)) {
      if (typeof settings[key] === 'undefined') {
        settings[key] = defaultSettings[key]
      }
    }
    settings.accountId = accountId
    return settings
  }

  static async resetSettings (accountId) {
    const settings = await SettingsModel.findOne({accountId})
    if (!settings) {
      return defaultSettings
    }
    await SettingsModel.remove({accountId})
    return defaultSettings
  }
}

module.exports = SettingsController
