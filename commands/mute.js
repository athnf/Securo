const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms'); // Pastikan install dulu: npm install ms

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member in the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to mute')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Mute duration (1m, 1h, 1d)')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false)
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
                        .setDescription('You do not have permission to mute members.')
                ],
                flags: [64]
            });
        }

        const targetUser = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Cari member di server
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Validasi duration
        const muteDuration = ms(duration);
        if (!muteDuration || muteDuration < 1000 || muteDuration > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⏰ Invalid Duration')
                        .setDescription('Please provide a valid mute duration (1m, 1h, 1d). Max 28 days.')
                ],
                flags: [64]
            });
        }

        // Cek apakah bot bisa moderate member
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⚠️ Bot Permission Error')
                        .setDescription('I do not have permission to mute members.')
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
                            .setDescription('You cannot mute a member with equal or higher roles.')
                    ],
                    flags: [64]
                });
            }
        }

        try {
            // Kirim DM ke user yang di-mute (opsional)
            await targetUser.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFFFF00)
                        .setTitle('🔇 Server Mute Notification')
                        .setDescription(`You have been muted in ${interaction.guild.name}`)
                        .addFields(
                            { name: '⏰ Duration', value: duration },
                            { name: '📝 Reason', value: reason },
                            { name: '👮 Moderator', value: interaction.user.toString() }
                        )
                ]
            }).catch(() => {}); // Tangkap error jika DM gagal

            // Proses mute
            await targetMember.timeout(muteDuration, `${interaction.user.tag}: ${reason}`);

            // Embed konfirmasi mute
            const muteEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('🔇 Member Muted')
                .setDescription(`${targetUser.toString()} has been muted.`)
                .addFields(
                    { name: '👤 Muted User', value: targetUser.tag, inline: true },
                    { name: '👮 Moderator', value: interaction.user.toString(), inline: true },
                    { name: '⏰ Duration', value: duration, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ 
                embeds: [muteEmbed],
                flags: [64]
            });

        } catch (error) {
            console.error('Mute error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Mute Failed')
                .setDescription('An error occurred while trying to mute the member.')
                .addFields({ name: '🛠️ Error Details', value: error.message });

            await interaction.reply({ 
                embeds: [errorEmbed],
                flags: [64]
            });
        }
    }
};