const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for a specific channel')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Channel to set slowmode')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText) // Hanya untuk text channel
        )
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Duration for slowmode (e.g., 1s, 5m, 1h)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // Cek izin
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚫 Permission Denied')
                        .setDescription('You do not have permission to manage channels.')
                ],
                flags: [64]
            });
        }

        const targetChannel = interaction.options.getChannel('channel');
        const durationInput = interaction.options.getString('duration');

        // Validasi durasi dengan ms
        const slowmodeDuration = ms(durationInput);
        if (!slowmodeDuration || slowmodeDuration < 0 || slowmodeDuration > 21600000) { // Max 6 jam
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⏰ Invalid Duration')
                        .setDescription('Please provide a valid slowmode duration (e.g., 1s, 5m, 1h). Max 6 hours.')
                ],
                flags: [64]
            });
        }

        try {
            // Set slowmode
            await targetChannel.setRateLimitPerUser (slowmodeDuration / 1000); // ms to seconds

            // Embed konfirmasi
            const slowmodeEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('🕒 Slowmode Set')
                .setDescription(`Slowmode has been set for ${targetChannel.toString()} to ${durationInput}.`)
                .addFields(
                    { name: '📅 Duration', value: durationInput, inline: true },
                    { name: '📢 Channel', value: targetChannel.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.reply({ 
                embeds: [slowmodeEmbed],
                flags: [64]
            });

        } catch (error) {
            console.error('Slowmode error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Slowmode Failed')
                .setDescription('An error occurred while trying to set slowmode.')
                .addFields({ name: '🛠️ Error Details', value: error.message });

            await interaction.reply({ 
                embeds: [errorEmbed],
                flags: [64]
            });
        }
    }
};