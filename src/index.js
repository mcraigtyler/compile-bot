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
    protocolsRegex = protocols.map(protocol => `[${protocol.charAt(0).toUpperCase()}|${protocol.charAt(0).toLowerCase()}]${protocol.slice(1)}`).join("|");

    imgRegex = new RegExp(`\\((?<protocol>${protocolsRegex}) (?<value>[0-6])\\)`, 'g');
    txtRegex = new RegExp(`\\<(?<protocol>${protocolsRegex}) (?<value>[0-6])\\>`, 'g');

    console.log(`Fetched ${cards.length} cards with ${protocols.length} protocols`);
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
    if(!process.env.CARDS_IMAGE_URL) {
        console.error("Missing environment variable: CARDS_IMAGE_URL");
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
    for (const match of matches) {
        if (match && embeds.length <= 8) {
            const protocol = match.groups.protocol;
            const value = parseInt(match.groups.value);

            if (value >= 0 && value <= 7) {
                try {
                    const card = cards.find(card => card.protocol.toLowerCase() === protocol.toLocaleLowerCase() && card.value === value);
                    if(!card) {
                        console.log(`${message.createdTimestamp}:${message.author.username} - Card not found[${protocol} ${value}]`);
                        return;
                    }

                    let description = '';
                    description += buildFieldText(card.top.emphasis, card.top.text);
                    description += buildFieldText(card.middle.emphasis, card.middle.text);
                    description += buildFieldText(card.bottom.emphasis, card.bottom.text);

                    const imgUrl = `${process.env.CARDS_IMAGE_URL}/${card.protocol}/${card.value}.jpg`;

                    console.log(`imgUrl: ${imgUrl}`);

                    const embed = new EmbedBuilder()
                        .setColor(process.env.EMBED_COLOR || 'Blue')
                        .setURL(`${process.env.CARDS_URL}?protocol=${card.protocol.toLowerCase()}&value=${card.value}&groupByProtocol=false`)
                        .setFooter({text: `CompileBot v${packageInfo.version}`, iconURL: `${process.env.ICON_URL}`});

                    if (showImage) {
                        embed.setImage(imgUrl);
                    } else {
                        embed.setTitle(`${card.protocol} ${card.value}`)
                        embed.setDescription(description);
                    }
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

})

checkEnvVars();
getCards().then(() => {
    console.log("Starting bot...");
    client.login(process.env.DISCORD_TOKEN);
}).catch(error => {
    console.error(`Error loading cards: ${JSON.stringify(error)}`);
    process.exit(1);
})
