const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const warningManager = require('../utils/warningManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listwarn')
        .setDescription('List warnings for a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to check warnings')
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
                        .setDescription('You do not have permission to view warnings.')
                ],
                flags: [64]
            });
        }

        const targetUser = interaction.options.getUser('user');
        const guildId = interaction.guildId;

        // Debug: Log informasi user
        console.log(`Checking warnings for user: ${targetUser.id}`);
        console.log(`Guild ID: ${guildId}`);

        // Ambil warnings
        const userWarnings = warningManager.getServerUserWarnings(guildId, targetUser.id);

        // Debug: Log warnings
        console.log(`Warnings for ${targetUser.id}:`, userWarnings);

        // Embed list warnings
        const listEmbed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
            .setDescription(`Total Warnings: ${userWarnings.length}/5`);

        if (userWarnings.length > 0) {
            userWarnings.forEach((warn, index) => {
                listEmbed.addFields({
                    name: `Warning #${index + 1}`,
                    value: `**Reason:** ${warn.reason}\n**Moderator:** <@${warn.moderator}>\n**Date:** <t:${Math.floor(warn.timestamp / 1000)}:R>`,
                    inline: false
                });
            });
        } else {
            listEmbed.setDescription('No warnings found for this user.');
        }

        await interaction.reply({ 
            embeds: [listEmbed],
            flags: [64]
        });
    }
};