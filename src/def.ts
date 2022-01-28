import { UserResolvable } from "discord.js"

export class UrlReg {
    member: UserResolvable
    domain: string
    id: string
    fullUrl: string
    msg: string
    channel: string
    guild: string
    constructor(member: string | null, domain: string, id: string, msg: string, fullUrl: string, channel: string, guild: string) {
        this.member = member!!
        this.domain = domain
        this.id = id
        this.msg = msg
        this.fullUrl=fullUrl
        this.channel=channel
        this.guild=guild
    }
}
export type RegRaw = {
    member: string,
    domain: string,
    id: string,
    msg: string,
    fullUrl: string,
    channel: string,
    guild: string
}

export type cfg = {
    notif: string
    appeal:string
}
