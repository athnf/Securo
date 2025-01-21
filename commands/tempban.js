const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempban')
        .setDescription('Temporarily ban a member from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to temporarily ban')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Ban duration (1m, 1h, 1d, 1w)')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the temporary ban')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // Cek izin moderator
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚫 Permission Denied')
                        .setDescription('You do not have permission to ban members.')
                ],
                flags: [64]
            });
        }

        const targetUser = interaction.options.getUser('user');
        const durationInput = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Validasi durasi dengan ms
        const banDuration = ms(durationInput);
        if (!banDuration || banDuration < 60000 || banDuration > 30 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⏰ Invalid Duration')
                        .setDescription('Please provide a valid ban duration (1m, 1h, 1d, 1w). Min 1 minute, max 30 days.')
                ],
                flags: [64]
            });
        }

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
                            .setDescription('You cannot ban a member with equal or higher roles.')
                    ],
                    flags: [64]
                });
            }
        }

        try {
            // Kirim DM ke user yang di-ban (opsional)
            await targetUser.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🔨 Temporary Ban Notification')
                        .setDescription(`You have been temporarily banned from ${interaction.guild.name}`)
                        .addFields(
                            { name: '⏰ Duration', value: durationInput },
                            { name: '📝 Reason', value: reason },
                            { name: '👮 Moderator', value: interaction.user.toString() }
                        )
                ]
            }).catch(() => {}); // Tangkap error jika DM gagal

            // Ban member
            await interaction.guild.bans.create(targetUser.id, {
                reason: `Temp Ban by ${interaction.user.tag}: ${reason}`,
                deleteMessageSeconds: 86400 // Hapus pesan 24 jam terakhir
            });

            // Waktu ban
            const banTime = Date.now();
            const unbanTime = banTime + banDuration;

            // Kirim pesan dengan countdown
            const countdownMessage = await interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFFFF00)
                        .setTitle('🕒 Temporary Ban Countdown')
                        .setDescription(`${targetUser.toString()} is banned`)
                        .addFields(
                            { name: '⏰ Ban Started', value: `<t:${Math.floor(banTime / 1000)}:R>` },
                            { name: '🔓 Unban Time', value: `<t:${Math.floor(unbanTime / 1000)}:R>` }
                        )
                ]
            });

            // Update countdown setiap menit
            const countdownInterval = setInterval(async () => {
                const remainingTime = unbanTime - Date.now();
                
                if (remainingTime <= 0) {
                    clearInterval(countdownInterval);
                    return;
                }

                try {
                    await countdownMessage.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFFFF00)
                                .setTitle('🕒 Temporary Ban Countdown')
                                .setDescription(`${targetUser.toString()} is banned`)
                                .addFields(
                                    { name: '⏰ Ban Started', value: `<t:${Math.floor(banTime / 1000)}:R>` },
                                    { name: '🔓 Unban Time', value: `<t:${Math.floor(unbanTime / 1000)}:R>` },
                                    { name: '⏳ Remaining Time', value: formatTime(remainingTime) }
                                )
                        ]
                    });
                } catch (error) {
                    clearInterval(countdownInterval);
                }
            }, 60000); // Update setiap menit

            // Jadwalkan unban
            setTimeout(async () => {
                try {
                    await interaction.guild.bans.remove(targetUser.id, `Temporary ban expired (${durationInput})`);
                    
                    // Hapus pesan countdown
                    await countdownMessage.delete();

                    // Kirim notifikasi unban
                    await interaction.channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x2ecc71)
                                .setTitle('🔓 Temporary Ban Lifted')
                                .setDescription(`${targetUser.toString()} has been unbanned after temporary ban.`)
                        ]
                    });
                } catch (unbanError) {
                    console.error('Error unbanning user:', unbanError);
                }
            }, banDuration);

            // Embed konfirmasi ban
            const banEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔨 Member Temporarily Banned')
                .setDescription(`${targetUser.toString()} has been temporarily banned.`)
                .addFields(
                    { name: '👤 Banned User', value: targetUser.tag, inline: true },
                    { name: '👮 Moderator', value: interaction.user.toString(), inline: true },
                    { name: '⏰ Duration', value: durationInput, inline: true },
                    { name : '📝 Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ 
                embeds: [banEmbed],
                flags: [64]
            });

        } catch (error) {
            console.error('Temporary ban error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Temporary Ban Failed')
                .setDescription('An error occurred while trying to temporarily ban the member.')
                .addFields({ name: '🛠️ Error Details', value: error.message });

            await interaction.reply({ 
                embeds: [errorEmbed],
                flags: [64]
            });
        }
    }
};

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}