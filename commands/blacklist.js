const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const blacklistManager = require('../utils/blacklistManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Restricted command: Only bot owner can use')
        .addSubcommand(subcommand => 
            subcommand
                .setName('add')
                .setDescription('Add a user to the blacklist')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('User to blacklist')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the blacklist')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('User to remove from blacklist')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('list')
                .setDescription('List all blacklisted users')
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('global')
                .setDescription('Enable or disable global blacklist')
                .addBooleanOption(option => 
                    option.setName('status')
                        .setDescription('Global blacklist status')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        // Cek apakah pengguna adalah owner bot dari environment variable
        const ownerId = process.env.OWNER_ID;
        
        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚫 Restricted Command')
                        .setDescription('This command is only accessible to the bot owner.')
                ],
                flags: [64]
            });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add': {
                const user = interaction.options.getUser('user');
                blacklistManager.addToBlacklist(user.id);

                const addEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🚫 User Blacklisted')
                    .setDescription(`${user.toString()} has been added to the blacklist.`)
                    .addFields(
                        { name: '👤 User', value: user.tag, inline: true },
                        { name: '🆔 User ID', value: user.id, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ 
                    embeds: [addEmbed],
                    flags: [64]
                });
                break;
            }

            case 'remove': {
                const user = interaction.options.getUser('user');
                blacklistManager.removeFromBlacklist(user.id);

                const removeEmbed = new EmbedBuilder()
                    .setColor(0x2ecc71)
                    .setTitle('✅ User Unblacklisted')
                    .setDescription(`${user.toString()} has been removed from the blacklist.`)
                    .addFields(
                        { name: '👤 User', value: user.tag, inline: true },
                        { name: '🆔 User ID', value: user.id, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ 
                    embeds: [removeEmbed],
                    flags: [64]
                });
                break;
            }

            case 'list': {
                const blacklist = blacklistManager.getBlacklist();
                
                if (blacklist.users.length === 0) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x2ecc71)
                                .setTitle('📋 Blacklist')
                                .setDescription('No users are currently blacklisted.')
                        ],
                        flags: [64]
                    });
                }

                // Ambil info user
                const userPromises = blacklist.users.map(async (userId) => {
                    try {
                        const user = await interaction.client.users.fetch(userId);
                        return `• ${user.tag} (${user.id})`;
                    } catch {
                        return `• ${userId} (User not found)`;
                    }
                });

                const userList = await Promise.all(userPromises);

                const listEmbed = new EmbedBuilder()
                    .setColor(0xFFFF00)
                    .setTitle('📋 Blacklisted Users')
                    .setDescription(userList.join('\n'))
                    .addFields(
                        { name: '🌍 Global Blacklist', value: blacklist.global ? 'Enabled' : 'Disabled', inline: true },
                        { name: '🔢 Total Blacklisted', value: blacklist.users.length.toString(), inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ 
                    embeds: [listEmbed],
                    flags: [64]
                });
                break;
            }

            case 'global': {
                const status = interaction.options.getBoolean('status');
                blacklistManager.setGlobalBlacklist(status);

                const globalEmbed = new EmbedBuilder()
                    .setColor(status ? 0xFF0000 : 0x2ecc71)
                    .setTitle('🌍 Global Blacklist')
                    .setDescription(`Global blacklist has been ${status ? 'enabled' :  'disabled'}.`)
                    .setTimestamp();

                await interaction.reply({ 
                    embeds: [globalEmbed],
                    flags: [64]
                });
                break;
            }
        }
    }
};