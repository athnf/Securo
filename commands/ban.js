const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to ban')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // Cek apakah pengguna memiliki izin ban
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚫 Permission Denied')
                        .setDescription('You do not have permission to ban members.')
                ],
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Cari member di server
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Cek apakah bot bisa ban member
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⚠️ Bot Permission Error')
                        .setDescription('I do not have permission to ban members.')
                ],
                ephemeral: true
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
                            .setDescription('You cannot ban a member with equal or higher roles.')
                    ],
                    ephemeral: true
                });
            }
        }

        try {
            // Kirim DM ke user yang di-ban (opsional)
            await targetUser.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🔨 Server Ban Notification')
                        .setDescription(`You have been banned from ${interaction.guild.name}`)
                        .addFields(
                            { name: '📝 Reason', value: reason },
                            { name: '👮 Moderator', value: interaction.user.toString() }
                        )
                ]
            }).catch(() => {}); // Tangkap error jika DM gagal

            // Proses ban
            await interaction.guild.members.ban(targetUser, { 
                reason: `${interaction.user.tag}: ${reason}` 
            });

            // Embed konfirmasi ban
            const banEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('🔨 Member Banned')
                .setDescription(`${targetUser.toString()} has been banned from the server.`)
                .addFields(
                    { name: '👤 Banned User', value: targetUser.tag, inline: true },
                    { name: '👮 Moderator', value: interaction.user.toString(), inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [banEmbed] });

        } catch (error) {
            console.error('Ban error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Ban Failed')
                .setDescription('An error occurred while trying to ban the member.')
                .addFields({ name: '🛠️ Error Details', value: error.message });

            await interaction.reply({ 
                embeds: [errorEmbed],
                flags: [64] 
            });
        }
    }
};