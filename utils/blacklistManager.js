const fs = require('fs');
const path = require('path');

class BlacklistManager {
    constructor() {
        this.blacklistPath = path.join(__dirname, '..', 'blacklist.json');
        this.initBlacklist();
    }

    initBlacklist() {
        if (!fs.existsSync(this.blacklistPath)) {
            fs.writeFileSync(this.blacklistPath, JSON.stringify({
                users: [],
                global: false
            }, null, 2));
        }
    }

    getBlacklist() {
        try {
            return JSON.parse(fs.readFileSync(this.blacklistPath, 'utf8'));
        } catch (error) {
            console.error('Error reading blacklist:', error);
            return { users: [], global: false };
        }
    }

    addToBlacklist(userId) {
        const blacklist = this.getBlacklist();
        if (!blacklist.users.includes(userId)) {
            blacklist.users.push(userId);
            this.saveBlacklist(blacklist);
        }
    }

    removeFromBlacklist(userId) {
        const blacklist = this.getBlacklist();
        blacklist.users = blacklist.users.filter(id => id !== userId);
        this.saveBlacklist(blacklist);
    }

    isBlacklisted(userId) {
        const blacklist = this.getBlacklist();
        return blacklist.users.includes(userId);
    }

    setGlobalBlacklist(status) {
        const blacklist = this.getBlacklist();
        blacklist.global = status;
        this.saveBlacklist(blacklist);
    }

    isGlobalBlacklistEnabled() {
        const blacklist = this.getBlacklist();
        return blacklist.global;
    }

    saveBlacklist(blacklist) {
        fs.writeFileSync(this.blacklistPath, JSON.stringify(blacklist, null, 2));
    }
}

module.exports = new BlacklistManager();