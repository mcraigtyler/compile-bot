import 'dotenv/config';
import packageInfo from '../package.json' with {type: 'json'};
import fetch from 'node-fetch';
import {Client, IntentsBitField, EmbedBuilder} from 'discord.js';

//const blankField = '\u200b';
const fieldPrefix = "```";
const fieldSuffix = "```";

let cards;
let protocols = [];
let protocolsRegex = "";
let imgRegex = undefined;
let txtRegex = undefined;
let missingBSides = [];

async function getCards() {
    console.log("Fetching cards...");
    try {
        const protocolsJSON = await fetch(process.env.PROTOCOLS_JSON_URL);
        protocols = await protocolsJSON.json();

        const cardsJSON = await fetch(process.env.CARDS_JSON_URL);
        cards = await cardsJSON.json();
    } catch (error) {
        console.error(`Error fetching cards: ${JSON.stringify(error)}`);
        return;
    }

    protocolsRegex = protocols.map(p => `[${p.protocol.charAt(0).toUpperCase()}|${p.protocol.charAt(0).toLowerCase()}]${p.protocol.slice(1)}`).join("|");

    imgRegex = new RegExp(`\\${process.env.MSG_IMG_PREFIX}(?<protocol>${protocolsRegex}) (?<value>[0-6aAbB])\\${process.env.MSG_IMG_SUFFIX}`, 'g');
    txtRegex = new RegExp(`\\${process.env.MSG_TXT_PREFIX}(?<protocol>${protocolsRegex}) (?<value>[0-6])\\${process.env.MSG_TXT_SUFFIX}`, 'g');

    console.log(`Fetched ${cards.length} cards with ${protocols.length} protocols`);

    missingBSides = (process.env.NO_B_SIDES) ? process.env.NO_B_SIDES.split(',') : [];
}

function checkEnvVars() {
    if(!process.env.DISCORD_TOKEN) {
        console.error("Missing environment variable: DISCORD_TOKEN");
        process.exit(1);
    }
    if(!process.env.PROTOCOLS_JSON_URL) {
        console.error("Missing environment variable: PROTOCOLS_JSON_URL");
        process.exit(1);
    }
    if(!process.env.CARDS_JSON_URL) {
        console.error("Missing environment variable: CARDS_JSON_URL");
        process.exit(1);
    }
    if(!process.env.CARDS_IMAGE_URL) {
        console.error("Missing environment variable: CARDS_IMAGE_URL");
        process.exit(1);
    }
    if(!process.env.MSG_IMG_PREFIX) {
        console.error("Missing environment variable: MSG_IMG_PREFIX");
        process.exit(1);
    }
    if(!process.env.MSG_IMG_SUFFIX) {
        console.error("Missing environment variable: MSG_IMG_SUFFIX");
        process.exit(1);
    }
    if(!process.env.MSG_TXT_PREFIX) {
        console.error("Missing environment variable: MSG_TXT_PREFIX");
        process.exit(1);
    }
    if(!process.env.MSG_TXT_SUFFIX) {
        console.error("Missing environment variable: MSG_TXT_SUFFIX");
        process.exit(1);
    }
}

function buildFieldText(emphasis, text) {
    let returnText = fieldPrefix;
    if (emphasis && emphasis.length > 0) {
        returnText += `${emphasis} `;
    }

    if(text && text.length > 0) {
        returnText += text;
    }else {
        returnText += ' ';
    }

    returnText += fieldSuffix;

    return returnText;
}

function buildCardEmbed(message, matches, showImage) {
    const embeds = [];
    const uniqueCards = new Set();
    
    for (const match of matches) {
        if (match && embeds.length <= 8) {
            const protocolValue = `${match.groups.protocol.toLowerCase()}-${match.groups.value.toLowerCase()}`;

            if(uniqueCards.has(protocolValue)) {
                continue;
            }

            const protocol = match.groups.protocol;

            try {

                const embed = new EmbedBuilder()
                    .setColor(process.env.EMBED_COLOR || 'Blue')
                    .setFooter({text: `CompileBot v${packageInfo.version}`, iconURL: `${process.env.ICON_URL}`});

                if (showImage) {
                    //If the value is a or b then uppercase it, otherwise it is a number so use it.
                    const isProtocol = isNaN(match.groups.value);
                    let isFound = true;
                    if(isProtocol) {
                        //Check for missing B sides
                        if(match.groups.value.toLowerCase() === 'b' && missingBSides.includes(protocol.toLowerCase())) {
                            isFound = false;
                        }
                    } else {
                        const value = parseInt(match.groups.value);
                        const card = cards.find(card => card.protocol.toLowerCase() === protocol.toLowerCase() && card.value === value);
                        if(!card) {
                            isFound = false;
                        }
                    }

                    const cardValue =  isProtocol ? match.groups.value.toUpperCase() : match.groups.value;
                    const cp = protocols.find(p => p.protocol.toLowerCase() === protocol.toLowerCase());
                    const imgUrl = (isFound) ? `${process.env.CARDS_IMAGE_URL}/${cp.protocol}/${cardValue}.jpg` : `${process.env.CARDS_IMAGE_URL}/404.jpg`;
                    console.log(`${message.createdTimestamp}:${message.author.username} - Sending image: ${imgUrl}`);

                    if(!isFound) {
                        embed.setTitle(`${protocol} ${cardValue}`)
                    }

                    embed.setImage(imgUrl);
                } else {
                    const value = parseInt(match.groups.value);
                    const card = cards.find(card => card.protocol.toLowerCase() === protocol.toLowerCase() && card.value === value);
                    if(!card) {
                        console.log(`${message.createdTimestamp}:${message.author.username} - Card not found[${protocol} ${match.groups.value}]`);
                        return;
                    }

                    let description = '';
                    description += buildFieldText(card.top.emphasis, card.top.text);
                    description += buildFieldText(card.middle.emphasis, card.middle.text);
                    description += buildFieldText(card.bottom.emphasis, card.bottom.text);

                    embed.setTitle(`${card.protocol} ${card.value}`)
                    embed.setURL(`${process.env.CARDS_URL}?protocol=${card.protocol.toLowerCase()}&value=${card.value}&groupByProtocol=false`)
                    embed.setDescription(description);
                }

                uniqueCards.add(protocolValue);
                embeds.push(embed);
            } catch (error) {
                console.error(`Error creating Embed for card: ${JSON.stringify(error)}`);
                return;
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
}

const client = new Client({
    intents: [
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.guilds.fetch().then((guilds) => {
        console.log(`Guilds: `);
        guilds.forEach(guild => {
            console.log(`\t${guild.name}`);
        });
    }).finally(() => {
        console.log(`Listening for messages...`);
    });
});

client.on('messageCreate', (message) => {
    console.log(`${message.createdTimestamp}:${message.author.username}`);

    // Ignore messages from the bot
    if(message.author.bot) return;

    if(message.content === '{{!refresh}}') {
        getCards().then(() => {
            message.reply(`Fetched ${cards.length} cards with ${protocols.length} protocols`);
        })
        .catch(error => {
            message.reply(`Error refreshing cards: ${JSON.stringify(error)}`);
        })
        return;
    }

    //No good way to check to see if there are matches so just process each
    const imgMatches = message.content.matchAll(imgRegex);
    buildCardEmbed(message, imgMatches, true);

    const txtMatches = message.content.matchAll(txtRegex);
    buildCardEmbed(message, txtMatches, false);

});

//joined a server
client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
})

//removed from a server
client.on("guildDelete", guild => {
    console.log("Left a guild: " + guild.name);

});

checkEnvVars();
getCards().then(() => {
    console.log("Starting bot...");
    client.login(process.env.DISCORD_TOKEN);
}).catch(error => {
    console.error(`Error loading cards: ${JSON.stringify(error)}`);
    process.exit(1);
})
