import 'dotenv/config';
import {Client, IntentsBitField, EmbedBuilder} from 'discord.js';
import cards from './cards.json' with { type: 'json' };

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
    for (const match of matches) {
        if (match) {
            const protocol = match.groups.protocol;
            const value = parseInt(match.groups.value);
            if (value >= 0 && value <= 6) {
                try {
                    const card = cards.find(card => card.protocol.toLowerCase() === protocol && card.value === value);
                    if(!card) {
                        console.log(`Card not found: ${protocol} ${value}`);
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${card.protocol} ${card.value}`)
                        .addFields([
                            {
                                name: 'Top',
                                value: (card.top && card.top.length > 0) ? card.top : ' '
                            },
                            {
                                name: 'Middle',
                                value: (card.middle && card.middle.length > 0) ? card.middle : ' '
                            },
                            {
                                name: 'Bottom',
                                value: (card.bottom && card.bottom.length > 0) ? card.bottom : ' '
                            }
                        ])
                    
                    message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error(`Error finding card: ${JSON.stringify(error)}`);
                    return;
                }
            }
        }
    }
})

client.login(process.env.DISCORD_TOKEN);