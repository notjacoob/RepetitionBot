const {REST} = require('@discordjs/rest')
const {Routes} = require('discord-api-types/v9')
const {SlashCommandBuilder} = require("@discordjs/builders")
const fs = require("fs")

//@ts-ignore
const token = JSON.parse(fs.readFileSync("./auth.json")).token

const clientId = '714633068580831272'
const testServerId = '693290026292740116'

const rest = new REST({version: '9'}).setToken(token);

/**
 * @type {SlashCommandBuilder[]}
 */
const commands = []

commands.push(new SlashCommandBuilder()
                .setName("notifications")
                .setDescription("Sets the notification channel"));
commands.push(new SlashCommandBuilder()
                .setName("appeals")
                .setDescription("Sets the appeals channel"))

    rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
    )
    rest.put(
        Routes.applicationGuildCommands(clientId, testServerId),
        {body: commands}
    )
