const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the invite link for the bot'),

    async execute(interaction) {
        // Link undangan bot
        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;

        // Membuat embed untuk menampilkan link undangan
        const inviteEmbed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('🤖 Invite Securo Bot')
            .setDescription('Click the link below to invite Securo Bot to your server!')
            .addFields(
                { name: '🔗 Invite Link', value: inviteLink }
            )
            .setFooter({ text: 'Thank you for using Securo Bot!' })
            .setTimestamp();

        await interaction.reply({ 
            embeds: [inviteEmbed],
            flags: [64] // Menggunakan flags untuk pesan privat
        });
    }
};