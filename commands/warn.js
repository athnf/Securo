const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const warningManager = require('../utils/warningManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to warn')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        // Cek izin
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚫 Permission Denied')
                        .setDescription('You do not have permission to warn members.')
                ],
                flags: [64]
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const guildId = interaction.guildId;

        // Debug: Log informasi warning
        console.log(`Attempting to warn user: ${targetUser.id}`);
        console.log(`Guild ID: ${guildId}`);
        console.log(`Reason: ${reason}`);

        // Tambah warning
        const totalWarnings = warningManager.addWarning(
            guildId, 
            targetUser.id, 
            reason, 
            interaction.user.id
        );

        // Debug: Log total warnings
        console.log(`Total warnings for ${targetUser.id}: ${totalWarnings}`);

        // Kick jika mencapai 5 warning
        if (totalWarnings >= 5) {
            try {
                const targetMember = await interaction.guild.members.fetch(targetUser.id);
                await targetMember.kick('Reached maximum warnings (5)');
                
                // Hapus warnings setelah kick
                warningManager.clearWarnings(guildId, targetUser.id);

                // Log kick
                console.log(`User ${targetUser.id} kicked for reaching 5 warnings`);
            } catch (error) {
                console.error('Error kicking user:', error);
            }
        }

        // Embed konfirmasi warning
        const warnEmbed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('⚠️ Member Warned')
            .setDescription(`${targetUser.toString()} has been warned.`)
            .addFields(
                { name: '👤 Warned User', value: targetUser.tag, inline: true },
                { name: '👮 Moderator', value: interaction.user.toString(), inline: true },
                { name: '📝 Reason', value: reason, inline: false },
                { name: '🔢 Total Warnings', value: `${totalWarnings}/5`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ 
            embeds: [warnEmbed],
            flags: [64]
        });
    }
};