module.exports = {
  required: ['body'],
  properties: {
    body: {
      required: ['increase'],
      properties: {
        increase: {type: 'integer', minimum: 1}
      }
    }
  }
}
