const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete a specified number of messages in the channel')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Number of messages to delete')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Cek izin
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚫 Permission Denied')
                        .setDescription('You do not have permission to manage messages.')
                ],
                flags: [64]
            });
        }

        // Cek apakah di text channel
        if (interaction.channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Invalid Channel')
                        .setDescription('This command can only be used in text channels.')
                ],
                flags: [64]
            });
        }

        const amount = interaction.options.getInteger('amount');

        try {
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ 
                limit: amount 
            });

            // Bulk delete
            const deletedMessages = await interaction.channel.bulkDelete(messages, true);

            // Embed konfirmasi
            const clearEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('🧹 Messages Cleared')
                .setDescription(`Successfully deleted ${deletedMessages.size} messages.`)
                .setTimestamp();

            // Kirim konfirmasi yang akan dihapus setelah 3 detik
            await interaction.reply({ 
                embeds: [clearEmbed],
                flags: [64]
            });

            // Log untuk audit
            console.log(`Cleared ${deletedMessages.size} messages in #${interaction.channel.name} by ${interaction.user.tag}`);

        } catch (error) {
            console.error('Clear messages error:', error);

            // Handler untuk pesan lebih dari 14 hari
            if (error.code === 10008) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('⚠️ Bulk Delete Limitation')
                            .setDescription('Cannot delete messages older than 14 days.')
                    ],
                    flags: [64]
                });
            }

            // Handler error umum
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Clear Failed')
                .setDescription('An error occurred while trying to clear messages.')
                .addFields({ name: '🛠️ Error Details', value: error.message });

            await interaction.reply({ 
                embeds: [errorEmbed],
                flags: [64]
            });
        }
    }
};