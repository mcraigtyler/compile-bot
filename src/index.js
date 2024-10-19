import 'dotenv/config';
import packageInfo from '../package.json' with {type: 'json'};
import fetch from 'node-fetch';
import {stripHtml} from 'string-strip-html';
import {Client, IntentsBitField, EmbedBuilder} from 'discord.js';

//const blankField = '\u200b';
const emtptyFieldValue = "``` ```";
const fieldPrefix = "```";
const fieldSuffix = "```";

let cards;
let protocols = [];
let protocolsRegex = "";

async function getCards() {
    console.log("Fetching cards...");
    try {
        const response = await fetch(process.env.CARDS_JSON_URL);
        cards = await response.json();
    } catch (error) {
        console.error(`Error fetching cards: ${JSON.stringify(error)}`);
        return;
    }

    protocols = Array.from(new Set(cards.map(card => card.protocol.toLowerCase())));
    protocolsRegex = protocols.join("|");

    console.log(`Fetched ${cards.length} cards.`);
}

function checkEnvVars() {
    if(!process.env.DISCORD_TOKEN) {
        console.error("Missing environment variable: DISCORD_TOKEN");
        process.exit(1);
    }
        if(!process.env.CARDS_JSON_URL) {
        console.error("Missing environment variable: CARDS_JSON_URL");
        process.exit(1);
    }    
}

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
})

client.on('messageCreate', (message) => {
    // Ignore messages from the bot
    if(message.author.bot) return;

    const matches = message.content.matchAll(new RegExp(`\\[(?<protocol>${protocolsRegex}) (?<value>[0-6])\\]`, 'g'));
    if(!matches) return;

    const embeds = [];
    for (const match of matches) {
        if (match && embeds.length <= 8) {
            const protocol = match.groups.protocol;
            const value = parseInt(match.groups.value);

            if (value >= 0 && value <= 7) {
                try {
                    const card = cards.find(card => card.protocol.toLowerCase() === protocol && card.value === value);
                    if(!card) {
                        console.log(`${message.createdTimestamp}:${message.author.username} - Card not found[${protocol} ${value}]`);
                        return;
                    }

                    let description = '';
                    description += (card.top && card.top.length > 0) ? `${fieldPrefix}${stripHtml(card.top).result}${fieldSuffix}` : emtptyFieldValue;
                    description += (card.middle && card.middle.length > 0) ? `${fieldPrefix}${stripHtml(card.middle).result}${fieldSuffix}` : emtptyFieldValue;
                    description += (card.bottom && card.bottom.length > 0) ? `${fieldPrefix}${stripHtml(card.bottom).result}${fieldSuffix}` : emtptyFieldValue;

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${card.protocol} ${card.value}`)
                        .setURL(`${process.env.CARDS_URL}?protocol=${card.protocol}&value=${card.value}`)
                        .setDescription(description)
                        .setFooter({text: `CompileBot v${packageInfo.version}`, iconURL: `${process.env.ICON_URL}`});
                    embeds.push(embed);
                } catch (error) {
                    console.error(`Error creating Embed for card: ${JSON.stringify(error)}`);
                    return;
                }
            }
        }
    }

    if (embeds.length > 0) {
        console.log(`${message.createdTimestamp}:${message.author.username} - Sending ${embeds.length} embeds`);
        try {
            message.reply({embeds});
        } catch (error) {
            console.error(`Error sending message: ${JSON.stringify(error)}`);
            return;
        }
    }
})

checkEnvVars();
getCards().then(() => {
    console.log("Starting bot...");
    client.login(process.env.DISCORD_TOKEN);
}).catch(error => {
    console.error(`Error loading cards: ${JSON.stringify(error)}`);
    process.exit(1);
})
