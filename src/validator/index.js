let schemas = require('../schema/index');
const Ajv = require('ajv');
let ajv = new Ajv({allErrors: true});

function getValidator(schema) {
    return ajv.compile(schemas[schema]);
}

module.exports = {getValidator};
