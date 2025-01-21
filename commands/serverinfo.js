const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display information about the server'),

    async execute(interaction) {
        const guild = interaction.guild;

        // Mengambil informasi server
        const serverName = guild.name;
        const serverId = guild.id;
        const memberCount = guild.memberCount;
        const owner = await guild.fetchOwner();
        const createdAt = guild.createdAt.toDateString();
        const region = guild.preferredLocale;
        const verificationLevel = guild.verificationLevel.toString(); // Convert to string
        const boostCount = guild.premiumSubscriptionCount || 0;
        const boostTier = guild.premiumTier.toString(); // Convert to string

        // Membuat embed untuk menampilkan informasi server
        const serverInfoEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle('🌐 Server Information')
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields([
                { name: '📛 Server Name', value: serverName || 'N/A', inline: true },
                { name: '🆔 Server ID', value: serverId || 'N/A', inline: true },
                { name: '👥 Member Count', value: memberCount.toString(), inline: true },
                { name: '👑 Server Owner', value: owner.user.tag || 'N/A', inline: true },
                { name: '📅 Created On', value: createdAt || 'N/A', inline: true },
                { name: '🌍 Region', value: region || 'N/A', inline: true },
                { name: '🔒 Verification Level', value: verificationLevel || 'N/A', inline: true },
                { name: '🎉 Boost Count', value: boostCount.toString(), inline: true },
                { name: '🚀 Boost Tier', value: boostTier ? `Tier ${boostTier}` : 'None', inline: true }
            ])
            .setFooter({ text: 'Securo Bot - Your Ultimate Moderation Tool' })
            .setTimestamp();

        await interaction.reply({ 
            embeds: [serverInfoEmbed],
            flags: [64] // Menggunakan flags untuk pesan privat
        });
    }
};