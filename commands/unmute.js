const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a previously muted member')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to unmute')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        // Cek apakah pengguna memiliki izin moderate members
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚫 Permission Denied')
                        .setDescription('You do not have permission to unmute members.')
                ],
                flags: [64]
            });
        }

        const targetUser = interaction.options.getUser('user');

        // Cari member di server
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Cek apakah bot bisa moderate member
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⚠️ Bot Permission Error')
                        .setDescription('I do not have permission to unmute members.')
                ],
                flags: [64]
            });
        }

        // Cek apakah member sedang di-mute
        if (!targetMember.isCommunicationDisabled()) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFFFF00)
                        .setTitle('ℹ️ Not Muted')
                        .setDescription(`${targetUser.toString()} is not currently muted.`)
                ],
                flags: [64]
            });
        }

        try {
            // Proses unmute
            await targetMember.timeout(null, `Unmuted by ${interaction.user.tag}`);

            // Kirim DM ke user yang di-unmute (opsional)
            await targetUser.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x2ecc71)
                        .setTitle('🔊 Unmute Notification')
                        .setDescription(`You have been unmuted in ${interaction.guild.name}`)
                        .addFields(
                            { name: '👮 Moderator', value: interaction.user.toString() }
                        )
                ]
            }).catch(() => {}); // Tangkap error jika DM gagal

            // Embed konfirmasi unmute
            const unmuteEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('🔊 Member Unmuted')
                .setDescription(`${targetUser.toString()} has been unmuted.`)
                .addFields(
                    { name: '👤 Unmuted User', value: targetUser.tag, inline: true },
                    { name: '👮 Moderator', value: interaction.user.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.reply({ 
                embeds: [unmuteEmbed],
                flags: [64]
            });

        } catch (error) {
            console.error('Unmute error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Unmute Failed')
                .setDescription('An error occurred while trying to unmute the member.')
                .addFields({ name: '🛠️ Error Details', value: error.message });

            await interaction.reply({ 
                embeds: [errorEmbed],
                flags: [64]
            });
        }
    }
};