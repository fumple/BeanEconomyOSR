"use strict";
const {createPool} = require("mysql2");
const SQLiteDatabase = require("better-sqlite3");

class Database extends require('node:events') {
  connection;
  dbConfig;
  all(sql, vars) {
    if (this.dbConfig.type == "mysql")
      return new Promise(async (k, no) => {
        if(this.connection === undefined) await this.connect(this.dbConfig);
        if(this.connection)
          this.connection.query(sql, vars,
            (err, result, _fields) => {
              if (err != null) no(err);
              else k(result);
            })
        else no("Connection error");
      })
    else
      return new Promise(async (k, no) => {
        if(this.connection === undefined) await this.connect(this.dbConfig);
        if(this.connection)
          k(this.connection.prepare(sql).all(...vars.map(e=>{
            if(e === true) return 1;
            if(e === false) return 0;
            return e;
          })))
      })
  };
  get(sql, vars) {
    return new Promise(async (k) => {
      k((await this.all(sql.toLowerCase().includes("limit") ? sql : sql + " LIMIT 1", vars))[0]);
    })
  };
  run(sql, vars) {
    if (this.dbConfig.type == "mysql")
      return new Promise(async (k, no) => {
        if(this.connection === undefined) await this.connect(this.dbConfig);
        if(this.connection)
          this.connection.execute(sql, vars,
            (err, result, _fields) => {
              if (err != null) no(err);
              else k(result.affectedRows);
            })
          else no("Connection error");
      })
    else
      return new Promise(async (k, no) => {
        if(this.connection === undefined) await this.connect(this.dbConfig);
        if(this.connection)
          k(this.connection.prepare(sql).run(...vars.map(e=>{
            if(e === true) return 1;
            if(e === false) return 0;
            return e;
          })).changes)
      })
  };
  cooldown(commandname, guildid, userid) {
    return new Promise(async (k) => {
      await this.deleteexpiredcooldowns()
      var data = await this.get("SELECT endsat FROM cooldown WHERE `commandname`=? AND `guildid`=? AND `userid`=? ORDER BY `endsat` DESC LIMIT 1", [commandname, guildid, userid])
      if (data == null) return k();
      if (data.endsat == null) return k();
      k(this.dbConfig.type == "mysql" ? data.endsat : new Date(data.endsat * 1000));
    })
  };
  allcooldown(userid) {
    return new Promise(async (k) => {
      await this.deleteexpiredcooldowns()
      var data = await this.all("SELECT commandname, guildid, MAX(endsat) as ends FROM cooldown WHERE `userid`=? GROUP BY commandname, guildid", [userid])
      k(Object.fromEntries(data.map(e => [e.guildid+"::"+e.commandname, this.dbConfig.type == "mysql" ? data.endsat : new Date(data.endsat * 1000)])));
    })
  };
  setcooldown(commandname, guildid, userid, seconds) {
    return new Promise(async (k) => {
      const date = this.dbConfig.type == "mysql"
      ? "DATE_ADD(NOW(), INTERVAL ? SECOND)"
      : "unixepoch('now',?)";
      if (seconds === 0) k(0);
      else k(await this.run(`INSERT INTO cooldown (commandname, guildid, userid, endsat) VALUES (?, ?, ?, ${date});`,
        [commandname, guildid, userid, this.dbConfig.type == "mysql" ? seconds.toString() : `+${seconds.toString()} seconds`])
      );
    })
  };
  lastran(guildid, userid, commandname) {
    return new Promise(async (k) => {
      const id = [guildid, userid, commandname].join("/");
      var data = await this.get("SELECT value FROM lastran WHERE `id`=?", [id])
      if (data == null) return k();
      k(data.value);
    })
  };
  setlastran(guildid, userid, commandname, channelid, messageid) {
    return new Promise(async (k) => {
      const id = [guildid, userid, commandname].join("/");
      const value = [channelid, messageid].join("/");
      k(await this.run(this.dbConfig.type == "mysql"
        ? "INSERT INTO lastran (id, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=?;"
        : "INSERT INTO lastran (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value=?;", [id, value, value]));
    })
  };
  async deleteexpiredcooldowns() {
    const date = this.dbConfig.type == "mysql" ? "NOW()" : "unixepoch()";
    let cd = await this.all("DELETE FROM cooldown WHERE endsat < "+date+" RETURNING `commandname`,`guildid`,`userid`,`endsat`;", []);
    this.emit('expiredCooldowns', cd)
  }
  async connect(config){
    if (config.type == "mysql")
      this.connection = await createPool({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
        timezone: config.timezone || (new Date().getTimezoneOffset() * -1 / 60 + ":00")
      });
    else
      this.connection = new SQLiteDatabase(config.file);

    await this.run("CREATE TABLE IF NOT EXISTS `cooldown` (`commandname` VARCHAR(256) NOT NULL, `guildid` CHAR(19) NOT NULL, `userid` CHAR(19) NOT NULL, `endsat` datetime NOT NULL)"
      + (config.type == "mysql" ? " ENGINE=INNODB" : ""), []);
    await this.run("CREATE TABLE IF NOT EXISTS `setting` (`id` "+(config.type == "mysql" ? "INT AUTO_INCREMENT NOT NULL PRIMARY KEY" : "ROWID")+", `module` VARCHAR(50) NOT NULL, `guildid` CHAR(19) NOT NULL, `key` VARCHAR(128) NOT NULL, `value` VARCHAR(2048) NOT NULL)"
      + (config.type == "mysql" ? " ENGINE=INNODB" : ""), []);
    await this.run("CREATE TABLE IF NOT EXISTS `lastran` (`id` VARCHAR(92) NOT NULL PRIMARY KEY, `value` VARCHAR(50) NOT NULL)"
      + (config.type == "mysql" ? " ENGINE=INNODB" : ""), []);
    await this.run("CREATE TABLE IF NOT EXISTS `commands` "+
      "("+
      "`name` VARCHAR(52) NOT NULL PRIMARY KEY,"+
      "`type` TINYINT UNSIGNED NOT NULL,"+
      "`successChance` FLOAT UNSIGNED NOT NULL,"+
      "`cooldown` INT UNSIGNED NOT NULL,"+
      "`outcomeBorder` INT NOT NULL,"+
      "`enabled` BOOL NOT NULL,"+
      "`message` VARCHAR(1512) NOT NULL,"+
      "`showInIndex` BOOL NOT NULL,"+
      "`failminPayout` INT NOT NULL,"+
      "`failmaxPayout` INT NOT NULL,"+
      "`successminPayout` INT NOT NULL,"+
      "`successmaxPayout` INT NOT NULL"+
      ")"
      + (config.type == "mysql" ? " ENGINE=INNODB" : ""), []);
    await this.run("CREATE TABLE IF NOT EXISTS `replies` "+
      "("+
      "`id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,"+
      "`command` VARCHAR(52) NOT NULL,"+
      "`type` VARCHAR(8) NOT NULL,"+
      "`content` VARCHAR(1512) NOT NULL,"+
      "`author` CHAR(19) NOT NULL,"+
      "`enabled` BOOL NOT NULL,"+
      "`minPayout` INT,"+
      "`maxPayout` INT,"+
      "`cooldown` INT UNSIGNED"+
      ")"
      + (config.type == "mysql" ? " ENGINE=INNODB" : ""), []);
  }
  constructor(config) {
    super()
    if (!["mysql", "sqlite"].includes(config.type)) throw new Error("[Database] Unsupported type");
    this.dbConfig = config;
  }
}

module.exports = Database;