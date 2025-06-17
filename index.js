// bot server log
const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, AuditLogEvent } = require('discord.js');

const TOKEN = 'Bot token';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites
    ]
});

// Configuration - Set your log channel ID here
let LOG_CHANNEL_ID = 'YOUR_LOG_CHANNEL_ID'; // Replace with your log channel ID

// Log settings - toggle these to enable/disable specific logs
const logSettings = {
    deletedMessages: false,
    editedMessages: false,
    purgedMessages: false,
    discordInvites: false,
    memberRoles: false,
    nameUpdates: false,
    avatarUpdates: false,
    bans: false,
    unbans: false,
    joins: false,
    leaves: false,
    timeouts: false,
    removeTimeouts: false,
    voiceJoin: false,
    voiceMove: false,
    voiceLeave: false,
    channelCreate: false,
    channelUpdate: false,
    channelDelete: false,
    roleCreation: false,
    roleUpdates: false,
    roleDeletion: false,
    serverUpdates: false,
    emojis: false
};

// Helper function to send log
async function sendLog(guild, embed) {
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        await logChannel.send({ embeds: [embed] });
    }
}

// Bot ready event
client.once('ready', async () => {
    console.log(`${client.user.tag} is online!`);
    
    // Register slash commands
    const commands = [
        {
            name: 'log',
            description: 'Manage server logging settings',
            options: [
                {
                    name: 'channel',
                    description: 'Set the log channel for server events',
                    type: 1, // SUB_COMMAND
                    options: [
                        {
                            name: 'channel',
                            description: 'The channel to send logs to',
                            type: 7, // CHANNEL type
                            required: true
                        }
                    ]
                },
                {
                    name: 'add',
                    description: 'Toggle log types on/off',
                    type: 1, // SUB_COMMAND
                    options: [
                        {
                            name: 'type',
                            description: 'The type of log to toggle',
                            type: 3, // STRING type
                            required: true,
                            choices: [
                                { name: 'Deleted messages', value: 'deletedMessages' },
                                { name: 'Edited messages', value: 'editedMessages' },
                                { name: 'Purged messages', value: 'purgedMessages' },
                                { name: 'Discord invites', value: 'discordInvites' },
                                { name: 'Member roles', value: 'memberRoles' },
                                { name: 'Name updates', value: 'nameUpdates' },
                                { name: 'Avatar updates', value: 'avatarUpdates' },
                                { name: 'Bans', value: 'bans' },
                                { name: 'Unbans', value: 'unbans' },
                                { name: 'Joins', value: 'joins' },
                                { name: 'Leaves', value: 'leaves' },
                                { name: 'Timeouts', value: 'timeouts' },
                                { name: 'Remove Timeouts', value: 'removeTimeouts' },
                                { name: 'Voice join', value: 'voiceJoin' },
                                { name: 'Voice move', value: 'voiceMove' },
                                { name: 'Voice leave', value: 'voiceLeave' },
                                { name: 'Channel create', value: 'channelCreate' },
                                { name: 'Channel update', value: 'channelUpdate' },
                                { name: 'Channel delete', value: 'channelDelete' },
                                { name: 'Role creation', value: 'roleCreation' },
                                { name: 'Role updates', value: 'roleUpdates' },
                                { name: 'Role deletion', value: 'roleDeletion' },
                                { name: 'Server updates', value: 'serverUpdates' },
                                { name: 'Emojis', value: 'emojis' }
                            ]
                        },
                        {
                            name: 'enabled',
                            description: 'Enable or disable this log type',
                            type: 5, // BOOLEAN type
                            required: true
                        }
                    ]
                },
                {
                    name: 'config',
                    description: 'Display current log settings',
                    type: 1 // SUB_COMMAND
                },
                {
                    name: 'reset',
                    description: 'Reset all log settings to disabled',
                    type: 1 // SUB_COMMAND
                }
            ]
        }
    ];
    
    try {
        await client.application.commands.set(commands);
        console.log('Slash commands registered successfully');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'log') {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel');
            
            if (!channel.isTextBased()) {
                await interaction.reply({ content: 'Please select a text channel.', ephemeral: true });
                return;
            }
            
            LOG_CHANNEL_ID = channel.id;
            await interaction.reply({ content: `Log channel has been set to ${channel}`, ephemeral: true });
            
            // Send confirmation to the new log channel
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Log Channel Updated')
                .setDescription(`This channel has been set as the server log channel by ${interaction.user.tag}`)
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });
        }
        
        if (subcommand === 'add') {
            const logType = interaction.options.getString('type');
            const enabled = interaction.options.getBoolean('enabled');
            
            if (logSettings.hasOwnProperty(logType)) {
                logSettings[logType] = enabled;
                
                const statusEmoji = enabled ? '✅' : '❌';
                const statusText = enabled ? 'enabled' : 'disabled';
                
                // Get readable name for the log type
                const readableNames = {
                    deletedMessages: 'Deleted messages',
                    editedMessages: 'Edited messages',
                    purgedMessages: 'Purged messages',
                    discordInvites: 'Discord invites',
                    memberRoles: 'Member roles',
                    nameUpdates: 'Name updates',
                    avatarUpdates: 'Avatar updates',
                    bans: 'Bans',
                    unbans: 'Unbans',
                    joins: 'Joins',
                    leaves: 'Leaves',
                    timeouts: 'Timeouts',
                    removeTimeouts: 'Remove Timeouts',
                    voiceJoin: 'Voice join',
                    voiceMove: 'Voice move',
                    voiceLeave: 'Voice leave',
                    channelCreate: 'Channel create',
                    channelUpdate: 'Channel update',
                    channelDelete: 'Channel delete',
                    roleCreation: 'Role creation',
                    roleUpdates: 'Role updates',
                    roleDeletion: 'Role deletion',
                    serverUpdates: 'Server updates',
                    emojis: 'Emojis'
                };
                
                await interaction.reply({ 
                    content: `${statusEmoji} **${readableNames[logType]}** logging has been ${statusText}.`, 
                    ephemeral: true 
                });
                
                // Send update to log channel if it exists
                if (LOG_CHANNEL_ID && LOG_CHANNEL_ID !== 'YOUR_LOG_CHANNEL_ID') {
                    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setColor(enabled ? '#00ff00' : '#ff0000')
                            .setTitle('Log Setting Updated')
                            .setDescription(`${statusEmoji} **${readableNames[logType]}** logging has been ${statusText} by ${interaction.user.tag}`)
                            .setTimestamp();
                        
                        await logChannel.send({ embeds: [embed] });
                    }
                }
            } else {
                await interaction.reply({ content: 'Invalid log type specified.', ephemeral: true });
            }
        }
        
        if (subcommand === 'config') {
            const readableNames = {
                deletedMessages: 'Deleted messages',
                editedMessages: 'Edited messages',
                purgedMessages: 'Purged messages',
                discordInvites: 'Discord invites',
                memberRoles: 'Member roles',
                nameUpdates: 'Name updates',
                avatarUpdates: 'Avatar updates',
                bans: 'Bans',
                unbans: 'Unbans',
                joins: 'Joins',
                leaves: 'Leaves',
                timeouts: 'Timeouts',
                removeTimeouts: 'Remove Timeouts',
                voiceJoin: 'Voice join',
                voiceMove: 'Voice move',
                voiceLeave: 'Voice leave',
                channelCreate: 'Channel create',
                channelUpdate: 'Channel update',
                channelDelete: 'Channel delete',
                roleCreation: 'Role creation',
                roleUpdates: 'Role updates',
                roleDeletion: 'Role deletion',
                serverUpdates: 'Server updates',
                emojis: 'Emojis'
            };
            
            let configText = '**Discord Bot Server Log Settings**\n\n';
            
            // Add log channel info
            if (LOG_CHANNEL_ID && LOG_CHANNEL_ID !== 'YOUR_LOG_CHANNEL_ID') {
                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                configText += `**Log Channel:** ${logChannel ? logChannel.toString() : 'Channel not found'}\n\n`;
            } else {
                configText += `**Log Channel:** Not set\n\n`;
            }
            
            // Add all log settings
            Object.entries(logSettings).forEach(([key, value]) => {
                const emoji = value ? '✅' : '❌';
                const name = readableNames[key] || key;
                configText += `${emoji} ${name}\n`;
            });
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Server Log Configuration')
                .setDescription(configText)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (subcommand === 'reset') {
            // Reset all log settings to false
            Object.keys(logSettings).forEach(key => {
                logSettings[key] = false;
            });
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Log Settings Reset')
                .setDescription('🔄 All log settings have been reset to disabled.\n\nUse `/log config` to view current settings or `/log add` to enable specific log types.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
            // Send notification to log channel if it exists
            if (LOG_CHANNEL_ID && LOG_CHANNEL_ID !== 'YOUR_LOG_CHANNEL_ID') {
                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Log Settings Reset')
                        .setDescription(`🔄 All log settings have been reset to disabled by ${interaction.user.tag}`)
                        .setTimestamp();
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        }
    }
});

// Message deleted
client.on('messageDelete', async (message) => {
    if (!logSettings.deletedMessages || message.author?.bot) return;
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Message Deleted')
        .addFields(
            { name: 'Author', value: `${message.author?.tag || 'Unknown'} (${message.author?.id || 'Unknown'})`, inline: true },
            { name: 'Channel', value: `${message.channel}`, inline: true },
            { name: 'Content', value: message.content || 'No content', inline: false }
        )
        .setTimestamp();
    
    await sendLog(message.guild, embed);
});

// Message edited
client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!logSettings.editedMessages || newMessage.author?.bot || oldMessage.content === newMessage.content) return;
    
    const embed = new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle('Message Edited')
        .addFields(
            { name: 'Author', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
            { name: 'Channel', value: `${newMessage.channel}`, inline: true },
            { name: 'Before', value: oldMessage.content || 'No content', inline: false },
            { name: 'After', value: newMessage.content || 'No content', inline: false }
        )
        .setTimestamp();
    
    await sendLog(newMessage.guild, embed);
});

// Member join
client.on('guildMemberAdd', async (member) => {
    if (!logSettings.joins) return;
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Member Joined')
        .addFields(
            { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    
    await sendLog(member.guild, embed);
});

// Member leave
client.on('guildMemberRemove', async (member) => {
    if (!logSettings.leaves) return;
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Member Left')
        .addFields(
            { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: 'Joined Server', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    
    await sendLog(member.guild, embed);
});

// Member role update
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (!logSettings.memberRoles) return;
    
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    
    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));
    
    if (addedRoles.size > 0 || removedRoles.size > 0) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Member Roles Updated')
            .addFields(
                { name: 'User', value: `${newMember.user.tag} (${newMember.user.id})`, inline: false }
            )
            .setTimestamp();
        
        if (addedRoles.size > 0) {
            embed.addFields({ name: 'Roles Added', value: addedRoles.map(role => role.name).join(', '), inline: false });
        }
        if (removedRoles.size > 0) {
            embed.addFields({ name: 'Roles Removed', value: removedRoles.map(role => role.name).join(', '), inline: false });
        }
        
        await sendLog(newMember.guild, embed);
    }
    
    // Name/nickname updates
    if (logSettings.nameUpdates && oldMember.nickname !== newMember.nickname) {
        const embed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle('Nickname Updated')
            .addFields(
                { name: 'User', value: `${newMember.user.tag} (${newMember.user.id})`, inline: false },
                { name: 'Old Nickname', value: oldMember.nickname || 'None', inline: true },
                { name: 'New Nickname', value: newMember.nickname || 'None', inline: true }
            )
            .setTimestamp();
        
        await sendLog(newMember.guild, embed);
    }
});

// User update (avatar, username changes)
client.on('userUpdate', async (oldUser, newUser) => {
    if (!logSettings.avatarUpdates && !logSettings.nameUpdates) return;
    
    if (logSettings.avatarUpdates && oldUser.avatar !== newUser.avatar) {
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle('Avatar Updated')
            .addFields(
                { name: 'User', value: `${newUser.tag} (${newUser.id})`, inline: false }
            )
            .setThumbnail(newUser.displayAvatarURL())
            .setTimestamp();
        
        // Send to all guilds the user is in
        client.guilds.cache.forEach(async (guild) => {
            if (guild.members.cache.has(newUser.id)) {
                await sendLog(guild, embed);
            }
        });
    }
    
    if (logSettings.nameUpdates && oldUser.username !== newUser.username) {
        const embed = new EmbedBuilder()
            .setColor('#00ffff')
            .setTitle('Username Updated')
            .addFields(
                { name: 'Old Username', value: oldUser.username, inline: true },
                { name: 'New Username', value: newUser.username, inline: true },
                { name: 'User ID', value: newUser.id, inline: false }
            )
            .setTimestamp();
        
        // Send to all guilds the user is in
        client.guilds.cache.forEach(async (guild) => {
            if (guild.members.cache.has(newUser.id)) {
                await sendLog(guild, embed);
            }
        });
    }
});

// Voice state updates
client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member || oldState.member;
    
    // Voice join
    if (!oldState.channel && newState.channel && logSettings.voiceJoin) {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Voice Channel Joined')
            .addFields(
                { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
                { name: 'Channel', value: newState.channel.name, inline: true }
            )
            .setTimestamp();
        
        await sendLog(member.guild, embed);
    }
    
    // Voice leave
    if (oldState.channel && !newState.channel && logSettings.voiceLeave) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Voice Channel Left')
            .addFields(
                { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
                { name: 'Channel', value: oldState.channel.name, inline: true }
            )
            .setTimestamp();
        
        await sendLog(member.guild, embed);
    }
    
    // Voice move
    if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id && logSettings.voiceMove) {
        const embed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle('Voice Channel Moved')
            .addFields(
                { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: false },
                { name: 'From', value: oldState.channel.name, inline: true },
                { name: 'To', value: newState.channel.name, inline: true }
            )
            .setTimestamp();
        
        await sendLog(member.guild, embed);
    }
});

// Ban events
client.on('guildBanAdd', async (ban) => {
    if (!logSettings.bans) return;
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Member Banned')
        .addFields(
            { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
            { name: 'Reason', value: ban.reason || 'No reason provided', inline: false }
        )
        .setTimestamp();
    
    await sendLog(ban.guild, embed);
});

client.on('guildBanRemove', async (ban) => {
    if (!logSettings.unbans) return;
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Member Unbanned')
        .addFields(
            { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true }
        )
        .setTimestamp();
    
    await sendLog(ban.guild, embed);
});

// Channel events
client.on('channelCreate', async (channel) => {
    if (!logSettings.channelCreate || !channel.guild) return;
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Channel Created')
        .addFields(
            { name: 'Channel', value: `${channel.name} (${channel.id})`, inline: true },
            { name: 'Type', value: ChannelType[channel.type], inline: true }
        )
        .setTimestamp();
    
    await sendLog(channel.guild, embed);
});

client.on('channelDelete', async (channel) => {
    if (!logSettings.channelDelete || !channel.guild) return;
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Channel Deleted')
        .addFields(
            { name: 'Channel', value: `${channel.name} (${channel.id})`, inline: true },
            { name: 'Type', value: ChannelType[channel.type], inline: true }
        )
        .setTimestamp();
    
    await sendLog(channel.guild, embed);
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (!logSettings.channelUpdate || !newChannel.guild) return;
    
    if (oldChannel.name !== newChannel.name || oldChannel.topic !== newChannel.topic) {
        const embed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle('Channel Updated')
            .addFields(
                { name: 'Channel', value: `${newChannel.name} (${newChannel.id})`, inline: false }
            )
            .setTimestamp();
        
        if (oldChannel.name !== newChannel.name) {
            embed.addFields({ name: 'Name Changed', value: `${oldChannel.name} → ${newChannel.name}`, inline: false });
        }
        if (oldChannel.topic !== newChannel.topic) {
            embed.addFields({ name: 'Topic Changed', value: `${oldChannel.topic || 'None'} → ${newChannel.topic || 'None'}`, inline: false });
        }
        
        await sendLog(newChannel.guild, embed);
    }
});

// Role events
client.on('roleCreate', async (role) => {
    if (!logSettings.roleCreation) return;
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Role Created')
        .addFields(
            { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
            { name: 'Color', value: role.hexColor, inline: true }
        )
        .setTimestamp();
    
    await sendLog(role.guild, embed);
});

client.on('roleDelete', async (role) => {
    if (!logSettings.roleDeletion) return;
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Role Deleted')
        .addFields(
            { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
            { name: 'Color', value: role.hexColor, inline: true }
        )
        .setTimestamp();
    
    await sendLog(role.guild, embed);
});

client.on('roleUpdate', async (oldRole, newRole) => {
    if (!logSettings.roleUpdates) return;
    
    if (oldRole.name !== newRole.name || oldRole.color !== newRole.color || oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        const embed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle('Role Updated')
            .addFields(
                { name: 'Role', value: `${newRole.name} (${newRole.id})`, inline: false }
            )
            .setTimestamp();
        
        if (oldRole.name !== newRole.name) {
            embed.addFields({ name: 'Name Changed', value: `${oldRole.name} → ${newRole.name}`, inline: false });
        }
        if (oldRole.color !== newRole.color) {
            embed.addFields({ name: 'Color Changed', value: `${oldRole.hexColor} → ${newRole.hexColor}`, inline: false });
        }
        
        await sendLog(newRole.guild, embed);
    }
});

// Guild update
client.on('guildUpdate', async (oldGuild, newGuild) => {
    if (!logSettings.serverUpdates) return;
    
    if (oldGuild.name !== newGuild.name || oldGuild.icon !== newGuild.icon) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Server Updated')
            .setTimestamp();
        
        if (oldGuild.name !== newGuild.name) {
            embed.addFields({ name: 'Name Changed', value: `${oldGuild.name} → ${newGuild.name}`, inline: false });
        }
        if (oldGuild.icon !== newGuild.icon) {
            embed.addFields({ name: 'Icon Changed', value: 'Server icon was updated', inline: false });
            embed.setThumbnail(newGuild.iconURL());
        }
        
        await sendLog(newGuild, embed);
    }
});

// Emoji events
client.on('emojiCreate', async (emoji) => {
    if (!logSettings.emojis) return;
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Emoji Created')
        .addFields(
            { name: 'Emoji', value: `${emoji.name} (${emoji.id})`, inline: true }
        )
        .setThumbnail(emoji.url)
        .setTimestamp();
    
    await sendLog(emoji.guild, embed);
});

client.on('emojiDelete', async (emoji) => {
    if (!logSettings.emojis) return;
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Emoji Deleted')
        .addFields(
            { name: 'Emoji', value: `${emoji.name} (${emoji.id})`, inline: true }
        )
        .setTimestamp();
    
    await sendLog(emoji.guild, embed);
});

// Login with bot token
client.login(TOKEN);

