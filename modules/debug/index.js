const { Client } = require("discord.js");
const fs = require("fs");
const path = require('path');

const _moduleID = path.basename(__dirname);

/** 
 * Register module
 * @param {Client} client - Discord
 * @param {Command[]} commands - Commands to register
 * @param {APIEndpoint[]} apiEndpoints - API Endpoints to register
 */
function register(client, commands, apiEndpoints){
    for(var f of fs.readdirSync(__dirname+"/commands")){
        console.log(f,__dirname+"/commands/"+f);
        commands.push(require(__dirname+"/commands/"+f))
    }
}

module.exports = {
    name:"Debug/Demo Commands",
    author:"@fumple",
    settings:[],
    register:register
}