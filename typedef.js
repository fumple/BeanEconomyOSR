const Discord = require("discord.js");
/**
 EarlyCTX definition
 @typedef {Object} EarlyCTX
 @property {Discord.Client} client - Discord
 @property {Discord.Message} msg - Message
 @property {string} prefix - Prefix
 @property {string} cmdname - Command name
 @property {Object} $ - Extra shortcut functions
*/

/**
 PreCTX definition
 @typedef {Object} PreCTX
 @property {Discord.Client} client - Discord
 @property {Discord.Message} msg - Message
 @property {Module} module - Module that registered the command
 @property {string} prefix - Prefix
 @property {string} cmdname - Command name
 @property {Discord.Role[]} allRoles - All roles
 @property {Object} $ - Extra shortcut functions
*/

/**
 CTX definition
 @typedef {PreCTX & {args: Object[]}} CTX
*/