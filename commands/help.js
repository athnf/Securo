const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all moderation commands'),
    
    async execute(interaction) {
        const commandsPath = path.join(__dirname);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        const embed = new EmbedBuilder()
            .setColor(0x2c3e50)  // Warna gelap
            .setTitle('🛡️ Securo Moderation Panel')
            .setDescription('**Advanced Server Protection & Management**\n\nEmpowering your server with precise moderation tools.')
            .setThumbnail('https://media.discordapp.net/attachments/1331125949856616542/1331306140277018695/a_futuristic_and_elegant_logo_featuring_the.jpeg?ex=679122f6&is=678fd176&hm=df2ca000bcbc9a96ee448e8fcc62ab4afab29352cd4ddb499ada4df227c27def&=&format=webp&width=497&height=497') 
        // Tambahkan commands
        const commandList = [];
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            if (command.data) {
                commandList.push(`\`/${command.data.name}\` - ${command.data.description || 'No description'}`);
            }
        }

        embed.addFields(
            { 
                name: '📋 Available Commands', 
                value: commandList.join('\n'), 
                inline: false 
            },
            {
                name: '⚙️ Bot Statistics',
                value: `• Total Commands: ${commandFiles.length}\n• Server Protection Level: High`,
                inline: false
            }
        );

        // Invite dan Owner Button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invite Securo')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.com/oauth2/authorize?client_id=1331298008582848725&permissions=8&integration_type=0&scope=bot')
                    .setEmoji('🤖'),
                new ButtonBuilder()
                    .setLabel('Join JZ HQ for Suggestions')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/6ctZfmhu3v')
                    .setEmoji('💡')
            );

        // Footer sederhana
        embed.setFooter({ 
            text: '🛡️ Securo Moderation Bot', 
        })
        .setTimestamp();

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            flags: [64] 
        });
    }
};