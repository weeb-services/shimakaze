module.exports = {
  required: ['body'],
  properties: {
    body: {
      additionalProperties: false,
      properties: {
        reputationPerDay: {type: 'number', minimum: 1},
        maximumReputation: {type: 'number', minimum: 0},
        maximumReputationReceivedDay: {type: 'number', minimum: 0},
        reputationCooldown: {type: 'number', minimum: 300}
      }
    }
  }
}
