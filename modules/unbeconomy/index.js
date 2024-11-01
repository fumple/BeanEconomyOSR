const { Client } = require("discord.js");
const axios = require("axios").default;
const path = require('path');

const _moduleID = path.basename(__dirname);

/** 
 * Register module
 * @param {Client} client - Discord
 * @param {Command[]} commands - Commands to register
 * @param {APIEndpoint[]} apiEndpoints - API Endpoints to register
 */
async function register(client, commands, apiEndpoints){
    var symbols = {};
    client.$.economy = {
        getSymbol: async (guildid)=>{
            if(symbols[guildid] == null){
                var { data } = await axios.get(`https://unbelievaboat.com/api/v1/guilds/${guildid}`, {
                    headers: {
                        'Authorization': client._config.unb
                    }
                }).catch(e => (console.error(e) || {data:{}}));
                symbols[guildid] = data.symbol;
                return data.symbol;
            }
            return symbols[guildid];
        },
        getUser: async (guildid, userid)=>{
            var { data } = await axios.get(`https://unbelievaboat.com/api/v1/guilds/${guildid}/users/${userid}`, {
                headers: {
                    'Authorization': client._config.unb
                }
            }).catch(e => (console.error(e) || {}));
            return data;
        },
        patchUser: async (guildid,userid,cash,bank,reason)=>{
            if(client._config.economyTestMode) return;
            var { data } = await axios.patch(`https://unbelievaboat.com/api/v1/guilds/${guildid}/users/${userid}`, {cash,bank,reason}, {
                headers: {
                    'Authorization': client._config.unb
                }
            }).catch(e => (console.error(e) || {}));
            return data;
        }
    };

    client.parser.register("economy:amount", function(val,extra){
        return this.parse("int", val, {...extra, allowedStrings:["all"]})
    })
    client.parser.register("economy:cashamount", async function(val,extra){
        if(this._guild == null) return "guildrequired"; 
        var parsed = (await this.parse("economy:amount", val, {...extra})).value;
        const userBal = await this._client.$.economy.getUser(this._guild.id, this._user.id);
        if(parsed == "all") return {key:userBal.cash,value:userBal.cash,display:userBal.cash};
        if(parsed > 0 && parsed <= userBal.cash) return {key:parsed,value:parsed,display:parsed};
        return "invalid";
    });
}

module.exports = {
    name:"UNB economy integration",
    author:"@fumple",
    settings:[],
    register:register
}