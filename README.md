# BeanEconomyOSR
Welcome to the repository for BeanEconomyOSR, the open source release of Bean Economy!

## What is Bean Economy?
Bean Economy is a Discord bot I've made a couple years ago for a Discord server named BeanJr's Community. I'm not sure what the exact date is, but the bot account exists since 2020.

## Why was the source code published?
For a while I didn't really have the motivation to work on the bot, so it kind of sat around for a long time with no updates. Now I have to make some major changes on my home server and I decided to stop hosting some old bots. Since I no longer will be hosting the bot I made the choice to release it's code.

## Is the code good?
Well, if you want to learn how to make bots in JS, I recommend against using this code as reference. I'm not that proud of this code... I wrote this bot a long time ago, when I had less experience. So as you can imagine, the code is not very readable. However when I came back to the code after a long time to prepare it for an open source release, I noticed that I had some good ideas for structuring a project. At one point in time I wanted to take the base of this bot and release it as a seperate thing, but that never happened. (Although I think I did use the base of this bot in another private bot for a moment but I'm not sure...)

I always wanted to clean up this bot, write it in a better programming language... but I never found the motivation or time to do that. Now that I'm studing Computer Science I know for a fact that I won't have enough time to make the changes I wanted to make, so I am officially ending support for the bot (more info in later section).

## You mentioned preparing the code for the open source release?
Yes, the code you see here isn't the exact same as what is (at the time of writing) currently deployed on my server. There were some issues that I knew I had to fix before releasing the code.

## What was changed?
- Added SQLite support
- Fixed some bugs that were never found in the code
- Replaced dependency on fumple.pl/paste with pastebin.com
- Removed outdated components
- Removed unused features
- Removed unneeded commands

## What about support for this code?
From now until 2024-12-01 I'll provide the following types of support:
- Support for BE bot owners regarding moving the bot to a different hosting provider and setting it up<br/>
  Note. I don't really have a ton of free time, so it might take me a bit before I respond to messages.
- Fixing critical bugs and bugs in existing features (reported through GitHub issues)

I'll not:
- Add new features
- Update dependencies of the bot

## How do I host the bot?

> [!WARNING]
> I can't think of every possible way to deploy the bot, there are many. When writing this guide I assumed that you deployed a Discord bot in the past at least once and/or worked with NodeJS before.

### 1. Prepare the config.json file
- Using `config.json.example` prepare a `config.json`.
- You may use either MySQL/MariaDB or SQLite
- The pastebin support may not be complete, there is a rate limit of 10 pastes per 24h, if it is enough for you, you may obtain a dev token at pastebin and paste it into "pasteToken"
- The UNB token can be obtained at UNB's website in the developer section
- All the values should be self-explanatory, I'm assuming that you know how to set up the bot on Discord.

### 2. Deploy the bot
You may host the bot in two ways:
- Using the provided docker image.
- By downloading the code and running it manually.

### 2a. Docker way
I don't know every way to launch a docker container, so I'll just provide the technical info and assume you'll know what to do with it.
- Image: `ghcr.io/fumple/beaneconomyosr:version`
- Required binding: `./config.json:/usr/src/app/config.json`
- If using SQLite3 you must also bind a directory or file on your machine or use a volume, so the data persists.
- If using MySQL/MariaDB make sure that the container will be able to reach your database.

### 2b. Standard way
Download the code onto your destination machine and then:
- Run `npm install`
- Make sure the `config.json` file is in the same directory as the bot files.
- Run using `node index.js` or your preferred way of running NodeJS applications.

## Last questions... Can I contribute to the bot?
If you're bored? Sure.

If you contribute in any way to the bot (that isn't fixing one typo), I'll be sure to add your name to `!version`.

## What if I want to revive this bot and start my own version or use it in another project?
You're welcome to do so, but remember that this bot is licensed under `AGPL-3.0-only`.

If you do make your own fork of this bot or use this code to make a different bot, please credit me and the original repository. While I'm not planning to work on this bot anymore, that doesn't mean that anyone can take this code and claim that they wrote it.