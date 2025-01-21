const { SlashCommandBuilder, EmbedBuilder, UserFlagsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get detailed information about a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to get information about')
                .setRequired(false)
        ),

    async execute(interaction) {
        // Pilih user yang di-mention atau pengguna yang menjalankan command
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const targetMember = interaction.options.getMember('user') || interaction.member;

        // Fungsi format tanggal
        const formatRelativeTime = (timestamp) => {
            const diff = Date.now() - timestamp;
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
        };

        // Fungsi untuk mendapatkan status emoji
        const getStatusEmoji = (status) => {
            switch (status) {
                case 'online': return '🟢';
                case 'idle': return '🟡';
                case 'dnd': return '🔴';
                case 'offline': return '⚫';
                default: return '⚪';
            }
        };

        // Ambil informasi user
        const userFlags = targetUser.flags ? new UserFlagsBitField(targetUser.flags) : null;

        // Badges/Flags - Lengkap dengan badge terbaru
        const userBadges = [];
        if (userFlags) {
            // Discord Official Badges
            if (userFlags.has('Staff')) userBadges.push('Discord Staff');
            if (userFlags.has('Partner')) userBadges.push('Partner');
            if (userFlags.has('VerifiedBot')) userBadges.push('Verified Bot');
            
            // Bug Hunter Badges
            if (userFlags.has('BugHunterLevel1')) userBadges.push('Bug Hunter');
            if (userFlags.has('BugHunterLevel2')) userBadges.push('Bug Hunter Gold');
            
            // HypeSquad Badges
            if (userFlags.has('HypeSquadOnlineHouse1')) userBadges.push('HypeSquad Bravery');
            if (userFlags.has('HypeSquadOnlineHouse2')) userBadges.push('HypeSquad Brilliance');
            if (userFlags.has('HypeSquadOnlineHouse3')) userBadges.push('HypeSquad Balance');
            
            // Other Special Badges
            if (userFlags.has('PremiumEarlySupporter')) userBadges.push('Early Supporter');
            if (userFlags.has('VerifiedDeveloper')) userBadges.push('Early Verified Bot Developer');
            
            // Newest Badges
            if (userFlags.has('ActiveDeveloper')) userBadges.push('Active Developer');
            if (userFlags.has('CertifiedModerator')) userBadges.push('Certified Moderator');
        }

        // Status dan aktivitas
        const status = targetMember?.presence?.status || 'offline';
        const statusEmoji = getStatusEmoji(status);
        
        const activities = targetMember?.presence?.activities || [];
        const currentActivity = activities.length > 0 
            ? activities.map(activity => {
                switch(activity.type) {
                    case 0: return `Playing ${activity.name}`;
                    case 1: return `Streaming ${activity.name}`;
                    case 2: return `Listening to ${activity.name}`;
                    case 3: return `Watching ${activity.name}`;
                    case 4: return `Custom Status: ${activity.state || ''}`;
                    default: return activity.name;
                }
            }).join(' | ')
            : 'No current activity';

        // Roles
        const roles = targetMember?.roles?.cache
            .filter(role => role.id !== interaction.guild.id)
            .map(role => role.toString())
            .slice(0, 10) || [];

        // Embed
        const userInfoEmbed = new EmbedBuilder()
            .setColor(targetMember?.displayColor || 0x3498db)
            .setTitle(`👤 User Information`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields([
                { 
                    name: '📛 Username', 
                    value: targetUser.tag, 
                    inline: true 
                },
                { 
                    name: '🆔 User ID', 
                    value: targetUser.id, 
                    inline: true 
                },
                { 
                    name: '🤖 Bot', 
                    value: targetUser.bot ? 'Yes' : 'No', 
                    inline: true 
                },
                { 
                    name: '📅 Account Created', 
                    value: `${new Date(targetUser.createdTimestamp).toLocaleDateString()} (${formatRelativeTime(targetUser.createdTimestamp)})`, 
                    inline: true 
                },
                { 
                    name: '🔰 Joined Server', 
                    value: targetMember ? `${new Date(targetMember.joinedTimestamp).toLocaleDateString()} (${formatRelativeTime(targetMember.joinedTimestamp)})` : 'N/A', 
                    inline: true 
                },
                { 
                    name: '🌈 Badges', 
                    value: userBadges.length > 0 ? userBadges.join(', ') : 'No Badges', 
                    inline: false 
                },
                { 
                    name: '🟢 Status', 
                    value: `${statusEmoji} ${status.charAt(0).toUpperCase() + status.slice(1)}`, 
                    inline: true 
                },
                { 
                    name: '🎮 Activity', 
                    value: currentActivity, 
                    inline: true 
                },
                { 
                    name: `📋 Roles [${roles.length}]`, 
                    value: roles.length > 0 ? roles.join(' ') : 'No Roles', 
                    inline: false 
                }
            ])
            .setFooter({ 
                text: 'Securo Bot - Detailed User Information', 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        await interaction.reply({ 
            embeds: [userInfoEmbed],
            flags: [64]
        });
    }
};