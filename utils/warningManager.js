const fs = require('fs');
const path = require('path');

class WarningManager {
    constructor() {
        this.warningsPath = path.join(__dirname, '..', 'warnings.json');
        // Pastikan file warnings.json selalu ada
        this.initWarningsFile();
    }

    // Inisialisasi file warnings jika belum ada
    initWarningsFile() {
        try {
            if (!fs.existsSync(this.warningsPath)) {
                fs.writeFileSync(this.warningsPath, JSON.stringify({}, null, 2));
            }
        } catch (error) {
            console.error('Error initializing warnings file:', error);
        }
    }

    // Membaca semua warnings
    getWarnings() {
        try {
            const data = fs.readFileSync(this.warningsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading warnings:', error);
            return {};
        }
    }

    // Mendapatkan warnings spesifik server dan user
    getServerUserWarnings(guildId, userId) {
        const warnings = this.getWarnings();
        // Pastikan mengembalikan array, bukan undefined
        return warnings[guildId]?.[userId] || [];
    }

    // Menambah warning
    addWarning(guildId, userId, reason, moderatorId) {
        const warnings = this.getWarnings();

        // Inisialisasi struktur jika belum ada
        if (!warnings[guildId]) warnings[guildId] = {};
        if (!warnings[guildId][userId]) warnings[guildId][userId] = [];

        // Tambah warning
        warnings[guildId][userId].push({
            reason: reason,
            moderator: moderatorId,
            timestamp: Date.now()
        });

        // Simpan
        this.saveWarnings(warnings);

        // Kembalikan jumlah total warnings untuk user ini
        return warnings[guildId][userId].length;
    }

    // Simpan warnings
    saveWarnings(warnings) {
        try {
            fs.writeFileSync(this.warningsPath, JSON.stringify(warnings, null, 2));
        } catch (error) {
            console.error('Error saving warnings:', error);
        }
    }

    // Hapus warning
    clearWarnings(guildId, userId) {
        const warnings = this.getWarnings();
        
        if (warnings[guildId] && warnings[guildId][userId]) {
            delete warnings[guildId][userId];
            this.saveWarnings(warnings);
        }
    }
}

module.exports = new WarningManager();