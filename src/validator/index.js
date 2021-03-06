const schemas = require('../schema/index')
const Ajv = require('ajv')
const ajv = new Ajv({allErrors: true})

function getValidator (schema) {
  return ajv.compile(schemas[schema])
}

module.exports = {getValidator}
