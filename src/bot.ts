import { Message, Client, Intents, MessageEmbed, TextChannel, GuildChannel, DMChannel, MessageActionRow, MessageButton, ButtonInteraction, UserResolvable, CommandInteraction } from "discord.js"
import {UrlReg, RegRaw, cfg} from './def'


import fs from "fs"
const {v4: uuidv4} = require('uuid')
const auth = require("../auth.json")

const sim = require("string-similarity")
const weekMs = 604800000
const lreg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

const client = new Client({intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES], partials: ["CHANNEL"]})
let urlmap: Array<UrlReg> = []

if (!fs.existsSync("./data.json")) {
    fs.writeFileSync("./data.json", "{}")
}
if (!fs.existsSync("./persist.json")) {
    fs.writeFileSync("./persist.json", "[]")
}

//@ts-ignore
const data: cfg = JSON.parse(fs.readFileSync("./data.json"))

//@ts-ignore
let unappealedInfractions: Array<UrlReg> = (JSON.parse(fs.readFileSync("./persist.json")) as Array<RegRaw>).map(d => new UrlReg(d.member, d.domain, d.id, d.msg, d.fullUrl, d.channel, d.guild))

client.once('ready', () => {
    console.log(`Ready: ${client.user?.username}`)
})
client.on("interactionCreate", async i => {
    if (i instanceof ButtonInteraction) {
            const regid = i.customId.split("_")[1]
            const reg = unappealedInfractions.find(r => r.id == regid)
            if (reg) {
                unappealedInfractions = unappealedInfractions.filter(r=>r.id != reg.id)
                    const g = await client.guilds.fetch(reg.guild)
                    if (g) {
                        const m = await g.members.fetch(reg.member)
                        if (i.customId.startsWith("accept")) {
                            m.disableCommunicationUntil(null, "appealed")
                            m.send("Your appeal has been accepted!")
                            i.reply({content: "Appeal accepted", ephemeral: true}).catch(err => {})
                        } else {
                            m.send("Your appeal has been denied!")
                            i.reply({content: "Appeal denied", ephemeral: true})
                        }
                    }
            } else {
                i.reply({content: "That appeal has already been resolved", ephemeral: true})
            }
    } else if (i instanceof CommandInteraction) {
            const channel = i.channel
            if (channel && i.member.permissions.has("MANAGE_CHANNELS")) {
                if (i.commandName == "notifications") {
                    data.notif = channel.id
                } else if (i.commandName == "appeals") {
                    data.appeal = channel.id
                }
                i.reply({content: `Set ${i.commandName} channel to <#${channel.id}>`, ephemeral:true})
            } else {
                i.reply({content: "You do not have permission to do that", ephemeral: true})
            }
    }
})
client.on('messageCreate', async (msg: Message) => {
    if (msg.channel instanceof GuildChannel) {
        if (lreg.test(msg.content)) {
            //@ts-ignore
            const rurl = lreg.exec(msg.content)[0]
            const urls = rurl.split("/")[(rurl.includes("http") || rurl.includes("https")) ? 2 : 0].split(".")[0]
            const urlai = urls.split("-")
            let tested: Array<String> =[]
            const id = uuidv4()
            const reg = new UrlReg(msg.member!!.id, urls, id, msg.id, rurl, msg.channel.id, msg.guild!!.id)
            urlmap.push(reg)
            setTimeout(() => {
                urlmap = urlmap.filter(reg => reg.id != id)
            }, 30000)
            const filtered = urlmap.filter(r => r.domain == urls && r.member == msg.member?.id)
            if (filtered.length > 2) {
                urlai.forEach(async url => {
                    if (!tested.includes(rurl)) {
                        const case1 = (sim.compareTwoStrings("discord", url) > 0.3) && (url != "discord" || urlai.length > 1)
                        const case2 = sim.compareTwoStrings("nitro", url) > 0.3
                        if (case1 || case2) {
                            if (msg.member != null && msg.member.moderatable) {
                                notifyInfraction(reg, true)
                                unappealedInfractions.push(reg)
                                filtered.forEach(async r => {
                                    const channel: TextChannel | null = await client.channels.fetch(r.channel) as TextChannel
                                    if (channel) {
                                        const msg = await channel.messages.fetch(r.msg)
                                        if (msg && msg.deletable) {
                                            await msg.delete().catch(err => {})
                                        }
                                    }
                                })
                                await msg.member.timeout(weekMs, "nitro scam")
                                msg.author.send("You have been muted for a suspected nitro scam.\nIf you believe this is a mistake, respond to this dm with \"appeal\" followed by your reason to appeal")
                            } else {
                                notifyInfraction(reg, false)
                                console.log(`Couldn't mute ${msg.author.tag}`)
                            }
                            tested.push(rurl)
                        } else {
                            if (urlai.length < 2) {
                                console.log("Normal spam detected")
                            } else {
                                tested.push(rurl)
                            }
                        }
                    }
                    tested = []
                })
            } else {
                console.log("Link detected")
            }
        }
    } else if (msg.channel instanceof DMChannel) {
        if (msg.content.startsWith("appeal")) {
            const reason = msg.content.replace("appeal", "")
            //@ts-ignore
            const f = unappealedInfractions.find(r => r.member == msg.author.id)
            if (f) {
                msg.reply("Processing appeal...")
                notifyAppeal(f, reason)
            }
        }
    }
 
})


const notifyInfraction = async (reg: UrlReg, muted: boolean) => {
    const channel = await client.channels.fetch(data.notif)
    if (channel && channel instanceof TextChannel) {
        const embed = new MessageEmbed()
        .setTitle("Scam detected")
        .setDescription(`User: <@${reg.member}>\n`+
                        `URL: \`${reg.fullUrl}\``)
        if (!muted) embed.setFooter("!! Could not mute user")
        channel.send({embeds: [embed]})
    }
}
const notifyAppeal = async (reg: UrlReg, reason: string) => {
    const channel = await client.channels.fetch(data.appeal)
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(`accept_${reg.id}`)
                .setLabel("Accept")
                .setStyle("SUCCESS"),
            new MessageButton()
                .setCustomId(`deny_${reg.id}`)
                .setLabel("Deny")
                .setStyle("DANGER")
        )
    if (channel && channel instanceof TextChannel) {
        const embed = new MessageEmbed()
        .setTitle("Scam appealed")
        .setDescription(`User: <@${reg.member}>\n`+
                        `URL: \`${reg.fullUrl}\`\n`+
                        `\nReason: ${reason}`)
        channel.send({embeds: [embed], components: [row]})
    }
}

const writeData = () => {
    fs.writeFileSync("./data.json", JSON.stringify(data))
    fs.writeFileSync("./persist.json", JSON.stringify(unappealedInfractions))
}

process.on("exit", writeData)
process.on('SIGINT', writeData)
process.on("SIGUSR1", writeData)
process.on("SIGUSR2", writeData)

client.login(auth.token)