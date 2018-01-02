function getAvailableReputations(user, settings, date) {
    let availableReputations = settings.reputationPerDay;
    for (let cooldown of user.cooldown) {
        if (cooldown.getTime() + settings.reputationCooldown.getTime() > date) {
            availableReputations -= 1;
        }
    }
    return availableReputations;
}

function getNextAvailableReputation(user) {
    let cooldowns = user.cooldown.sort((a, b) => {
        return a.getTime() - b.getTime();
    });
    cooldowns = cooldowns.map((cooldown) => {
        return cooldown.getTime() - Date.now();
    });
    return cooldowns;
}

module.exports = {getAvailableReputations, getNextAvailableReputation};
