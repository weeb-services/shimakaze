function getAvailableReputations (user, settings, date) {
  let availableReputations = settings.reputationPerDay
  for (const cooldown of user.cooldown) {
    if (cooldown.getTime() + settings.reputationCooldown.getTime() > date) {
      availableReputations -= 1
    }
  }
  return availableReputations
}

function getNextAvailableReputation (user) {
  let cooldowns = user.cooldown.sort((a, b) => {
    return a.getTime() - b.getTime()
  })
  cooldowns = cooldowns.map((cooldown) => {
    cooldown = cooldown.getTime() - Date.now()
    cooldown += 1000 * 60 * 60 * 24
    return cooldown
  })
  return cooldowns
}

module.exports = {getAvailableReputations, getNextAvailableReputation}
