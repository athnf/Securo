const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete messages from a specific user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User whose messages will be deleted')
                .setRequired(true)
        )
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

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        try {
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: 100 });

            // Filter pesan dari user tertentu
            const userMessages = messages.filter(m => m.author.id === targetUser.id).first(amount);

            // Bulk delete
            const deletedMessages = await interaction.channel.bulkDelete(userMessages, true);

            // Embed konfirmasi
            const purgeEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('🗑️ User Messages Purged')
                .setDescription(`Successfully deleted ${deletedMessages.size} messages from ${targetUser.toString()}.`)
                .addFields(
                    { name: '👤 Target User', value: targetUser.tag, inline: true },
                    { name: '🔢 Messages Deleted', value: deletedMessages.size.toString(), inline: true }
                )
                .setTimestamp();

            // Kirim konfirmasi yang akan dihapus setelah 3 detik
            await interaction.reply({ 
                embeds: [purgeEmbed],
                flags: [64]
            });

            // Log untuk audit
            console.log(`Purged ${deletedMessages.size} messages from ${targetUser.tag} in #${interaction.channel.name} by ${interaction.user.tag}`);

        } catch (error) {
            console.error('Purge messages error:', error);

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

            // Handler untuk user tidak memiliki pesan
            if (deletedMessages.size === 0) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFFFF00)
                            .setTitle('ℹ️ No Messages')
                            .setDescription(`No messages found from ${targetUser.toString()} in the last 100 messages.`)
                    ],
                    flags: [64]
                });
            }

            // Handler error umum
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Purge Failed')
                .setDescription('An error occurred while trying to purge messages.')
                .addFields({ name: '🛠️ Error Details', value: error.message });

            await interaction.reply({ 
                embeds: [errorEmbed],
                flags: [64]
            });
        }
    }
};