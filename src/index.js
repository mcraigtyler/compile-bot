import 'dotenv/config';
import {Client, IntentsBitField, EmbedBuilder} from 'discord.js';
import cards from './cards.json' with { type: 'json' };
import {stripHtml } from 'string-strip-html';

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
    if(message.author.bot) return;

    const matches = message.content.matchAll(/\{\{(?<protocol>apathy|darkness|death|fire|gravity|hate|life|light|love|metal|plague|psychic|speed|spirit|water)\}\{(?<value>[0-6])\}\}/g);
    if(!matches) return;
    const embeds = [];
    for (const match of matches) {
        if (match && embeds.length <= 8) {
            const protocol = match.groups.protocol;
            const value = parseInt(match.groups.value);
            if (value >= 0 && value <= 6) {
                try {
                    const card = cards.find(card => card.protocol.toLowerCase() === protocol && card.value === value);
                    if(!card) {
                        console.log(`Card not found: ${protocol} ${value}`);
                        return;
                    }

                    let description = '';
                    description += (card.top && card.top.length > 0) ? "```"+stripHtml(card.top).result+"```" : "```          ```";
                    description += (card.middle && card.middle.length > 0) ? "```"+stripHtml(card.middle).result+"```" : "```          ```";
                    description += (card.bottom && card.bottom.length > 0) ? "```"+stripHtml(card.bottom).result+"```" : "```          ```";

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${card.protocol} ${card.value}`)
                        .setDescription(description);
                        // .addFields([
                        //     {
                        //         name: '\u200b',
                        //         value: (card.top && card.top.length > 0) ? "```"+card.top+"```" : "```          ```"
                        //     },
                        //     {
                        //         name: '\u200b',
                        //         value: (card.middle && card.middle.length > 0) ? "```"+card.middle+"```" : "```          ```"
                        //     },
                        //     {
                        //         name: '\u200b',
                        //         value: (card.bottom && card.bottom.length > 0) ? "```"+card.bottom+"```" : "```          ```"
                        //     }
                        // ])
                    
                    embeds.push(embed);
                } catch (error) {
                    console.error(`Error finding card: ${JSON.stringify(error)}`);
                    return;
                }
            }
        }
    }

    if (embeds.length > 0) {
        message.reply({embeds});
    }
})

client.login(process.env.DISCORD_TOKEN);