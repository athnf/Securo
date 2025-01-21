const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        // Cek apakah pengguna memiliki izin kick
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚫 Permission Denied')
                        .setDescription('You do not have permission to kick members.')
                ],
                flags: [64]
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Cari member di server
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Cek apakah bot bisa kick member
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⚠️ Bot Permission Error')
                        .setDescription('I do not have permission to kick members.')
                ],
                flags: [64]
            });
        }

        // Cek hierarki role
        if (targetMember) {
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('🚫 Hierarchy Restriction')
                            .setDescription('You cannot kick a member with equal or higher roles.')
                    ],
                    flags: [64]
                });
            }
        }

        try {
            // Kirim DM ke user yang di-kick (opsional)
            await targetUser.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFFFF00)
                        .setTitle('👢 Server Kick Notification')
                        .setDescription(`You have been kicked from ${interaction.guild.name}`)
                        .addFields(
                            { name: '📝 Reason', value: reason },
                            { name: '👮 Moderator', value: interaction.user.toString() }
                        )
                ]
            }).catch(() => {}); // Tangkap error jika DM gagal

            // Proses kick
            await targetMember.kick(`${interaction.user.tag}: ${reason}`);

            // Embed konfirmasi kick
            const kickEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('👢 Member Kicked')
                .setDescription(`${targetUser.toString()} has been kicked from the server.`)
                .addFields(
                    { name: '👤 Kicked User', value: targetUser.tag, inline: true },
                    { name: '👮 Moderator', value: interaction.user.toString(), inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ 
                embeds: [kickEmbed],
                flags: [64]
            });

        } catch (error) {
            console.error('Kick error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Kick Failed')
                .setDescription('An error occurred while trying to kick the member.')
                .addFields({ name: '🛠️ Error Details', value: error.message });

            await interaction.reply({ 
                embeds: [errorEmbed],
                flags: [64]
            });
        }
    }
};