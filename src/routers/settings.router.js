const BaseRouter = require('wapi-core').BaseRouter
const SettingsController = require('../controller/settings.controller')
const validator = require('../validator/index.js')
const Ajv = require('ajv')
const ajv = new Ajv({allErrors: true})
const HTTPCodes = require('wapi-core').Constants.HTTPCodes

class SettingsRouter extends BaseRouter {
  constructor () {
    super()
    this.get('/settings', async req => {
      const settings = await SettingsController.getSettings(req.account.id)
      return {settings}
    })
    this.post('/settings', async req => {
      const requestValidator = validator.getValidator('settings')
      const bodyCheck = requestValidator({body: req.body})
      if (!bodyCheck) {
        return {
          status: HTTPCodes.BAD_REQUEST,
          errors: requestValidator.errors,
          message: ajv.errorsText(requestValidator.errors),
          in: 'body'
        }
      }
      const settings = await SettingsController.updateSettings(req.account.id, req.body)
      return {settings}
    })
    this.delete('/settings', async req => {
      const settings = await SettingsController.resetSettings(req.account.id)
      return {settings}
    })
  }
}

module.exports = SettingsRouter
