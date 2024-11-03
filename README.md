# Discord Bot for Compile

This is a Discord bot created for the game [Compile](https://greaterthangames.com/product/compile-main-1/). It utilizes the Compile DB website, developed by [Chuck Player](https://chuckplayer.github.io/compile/) and [Ryan Scherr](https://ryanascherr.github.io/compile/), to provide information and functionality related to the game.


## Credits
- Game: [Compile](https://greaterthangames.com/product/compile-main-1/) ([BGG](https://boardgamegeek.com/boardgame/406652/compile-main-1))
- Game Publisher: [Greater Than Games](https://greaterthangames.com/)
- Game Designer: [Michael Yang](https://boardgamegeek.com/boardgamedesigner/158096/michael-yang)
- Compile DB: [Ryan Scherr](https://github.com/ryanascherr/compile) and [Chuck Player](https://github.com/chuckplayer/compile)

## Features

- Provides information about cards and protocols by replying to messages where the card was referenced.
- Allows users to mention a card in the message to which the bot will reply with the card information.
- If a Protocol-Value is requested, but the card does not exist, a 404 card will be used.
- If the same Protocol-Value is requested multiple times in a message, the bot will reply just once per card.

## Installation

1. Clone the repository: `git clone https://github.com/your-username/discord-bot-compile.git`
1. Install dependencies: `npm install`
1. Copy the [.env.example](https://github.com/mcraigtyler/compile-bot/blob/master/.env.example) to `.env` and provide the relavant values to each variable in that file.
   - You will need your Discord bot's application ID which can be retrieved in the section below.
   - You can refernce the json files on [Chuck's Compile DB site](https://chuckplayer.github.io/compile/cards.json) or modify the code to store the file with the bot's code here.
   - You can change the delimiters for Image and Text cards using MSG_IMG_ and MSG_TXT_ variables.
1. Copy the bot's Token to the `.env` file.
1. Start the bot: `npm run start`
1. Follow [these steps](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) to create the bot application on discord
1. Invite the bot to your server using the URL created in step 1.

The bot should show up as a user within your server. If it does not permissions may not be setup corectly. Consult the Discord.js documentation.

## Usage

With the bot invited to your server it will look for any message containing phrases matching the following:
- `(protocol value)` - The bot will reply with an Image of the card matching the Protocol and Value.
- `<protocol value>` - The bot will reply with a text version of the card.
- Currently only values of `0-6` are valid for cards.
- The Protocol card can be requested by using values `A` and `B` for the front and back of the Protocol card.

Messages can contain multiple cards with combinations of Image and Text versions of the cards.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

[Join us on the Compile Discord server!](https://discord.gg/S3fpeaqm)

## License

This project is licensed under the [GPLv3 License](https://opensource.org/license/gpl-3-0).

This project is not affliated with, or endorsed by, Greater Than Games LLC or Discord Inc.