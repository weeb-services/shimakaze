module.exports = {
  required: ['body'],
  properties: {
    body: {
      required: ['decrease'],
      properties: {
        decrease: {type: 'integer', minimum: 1}
      }
    }
  }
}
