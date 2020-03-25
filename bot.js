const Discord = require('discord.js');
var moment = require('moment');
const client = new Discord.Client();
const { prefix, token } = require('./config.json');

let market = [];
let operating = true;
const multiListing = false;


client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});


client.on('message', message => {
    // Check if it is a Command Message
    if (!message.content.startsWith(prefix) || message.author.bot) {
        return;
    }

    // Exract the command and arguments to the command
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    const isAdmin = message.member.hasPermission("ADMINISTRATOR");

    // Admin Commands
    if (isAdmin){
        if (command === 'haltmarket') {
            operating = !operating;
            if (operating){
                message.channel.send(`Stalk Market trading has resumed.`);
            } else {
                message.channel.send(`Stalk Market trading has been halted.`);
            }
        }
    }


    if (!operating){
        return;
    }

	if (command === 'price') {
        // Ex. price message
        // !price 500 5 to 8pm
        // !price 1000 4 to 6am

        // Split by spaces
        //(5) ["!price", "500", "5", "to", "8pm"]
        let [price, start, between, end] = args;


        // Check to see if the user has already posted a price
        let posted = false;
        if (!multiListing && market.filter(item => item.author.id = message.author.id).length){
            message.reply("You already posted your price. Tell me to `!cancel` it before posting another.");
            return;
        };

        // Check the price
        const parsedPrice = Number.parseInt(price);
        if (Number.isNaN(parsedPrice)) {
            message.reply("I didn't understand your price.");
            return;
        }

        //check start time
        // If Start time has AM or PM at the end, extract that appropriately.
        let meridian = 1;
        if (start.toLowerCase().endsWith('pm')){
            meridian = 13;
        }
        const parsedStart = moment().hour(Number.parseInt(start) - 1 + meridian).minute(0).millisecond(0);

        if (Number.isNaN(Number.parseInt(start)) || Number.parseInt(start) > 24) {
            message.reply(`I didn't understand your beginning time frame. I read it as **"${start}"**`);
            return;
        }

        //check end time
        // If end time has AM or PM at the end, extract that appropriately.
        meridian = 1;
        if (end.toLowerCase().endsWith('pm')){
            meridian = 13;
        }

        const parsedEnd = moment().hour(Number.parseInt(end) - 1 + meridian).minute(0).millisecond(0);

        if (Number.isNaN(Number.parseInt(end)) || Number.parseInt(end) > 24) {
            message.reply(`I didn't understand your ending time. I read it as **"${end}"**`);
            return;
        }

        if (parsedEnd.isSameOrBefore(parsedStart)){
            message.reply("Your gate has to be open for longer than that...");
            return;
        }

        const marketItem = `I've got you down for ${parsedPrice} bells, open from ${parsedStart.format('h A')} to ${parsedEnd.format('h A')} today.`;
        message.reply(marketItem)
        market.push({
            author: message.author,
            price: price,
            start: parsedStart,
            end: parsedEnd
        });
        return;
    }
    if (command === 'market') {
        // Remove all market items that are expired and only show the top 3 that are open now.
        let marketMessage = new Discord.MessageEmbed()
            .setColor('#99007f')
            .setTitle('The Stalk Market')
            .setDescription('Current Prices')
            .setTimestamp();

        var now = moment();

        let openNow = '';
        market.filter(item => now.isAfter(item.start) && now.isBefore(item.end))
                .sort((a, b) => b.price - a.price)
                .slice(0, 3)
                .forEach(item => {
                    openNow = openNow + `${item.author.username}: ${item.price} bells -- Open from ${item.start.format('h A')} to ${item.end.format('h A')}\r\n`;
                });

        let upcoming = '';
        market.filter(item => now.isBefore(item.start))
                .sort((a, b) => b.price - a.price)
                .slice(0, 10)
                .forEach(item => {
                    upcoming = upcoming + `${item.author.username}: ${item.price} bells -- Open from ${item.start.format('h A')} to ${item.end.format('h A')}\r\n`;
                });

        if (openNow != ''){
            marketMessage.addField('Open Now', openNow);
        }

        if (upcoming != ''){
            marketMessage.addField('Upcoming', upcoming);
        }

        if (openNow === '' && upcoming === ''){
            marketMessage.addField('Nothing on the board', 'The market is empty');
        }

        message.channel.send(marketMessage);
    }

    if (command === 'help') {
        const helpMessage = new Discord.MessageEmbed()
          .setColor('#99007f')
          .setTitle('The Stalk Market')
          .setDescription('List of commands:')
          .addFields(
              { name: '!price {# of bells} {Open from} {until}', value: '**Examples**\r\n`!price 288 5pm to 8pm` - 288 Bells and your gates are open from 5 pm to 8 pm\r\n`!price 100 6am to 9am` - 100 Bells and your gates are open from 6 am to 9 am\r\n' },
              { name: '!market', value: 'Show the current market board.' },
              { name: '!cancel', value: 'Remove your post from the market board.' },
              { name: '!help', value: 'Show this help menu.' },
          )
          .setTimestamp()
          .setFooter('Created by klaser');

        message.channel.send(helpMessage);
    }

    if (command === 'cancel'){
        market = market.filter(item => item.author.id != message.author.id);
        message.reply("Okay. I've canceled your posting");
        return;
    }

});

client.login(token);
