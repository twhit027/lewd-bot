/*LEWD-BOT*/

// Initialization
'use strict';

var Botkit = require('./lib/Botkit.js');
var _ = require('lodash');
var os = require('os');

var controller = Botkit.slackbot({debug: false});
var bot = controller.spawn({token: process.env.token}).startRTM();

// Constants

var lewdTerms = [
    'ass',
    'beach',
    'bikini',
    'boobs',
    'booty',
    'bounce',
    'bounce break',
    'bra',
    'breasts',
    'camgirl',
    'chick',
    'cowgirl',
    'girl',
    'hot',
    'jiggle',
    'jiggly',
    'lewdPerson',
    'lingerie',
    'naked',
    'nipples',
    'nude',
    'panties',
    'pawg',
    'rack',
    'sexy',
    'slutty',
    'swimsuit',
    'thong',
    'tits',
    'twerk',
    'wild',
    'wooty',
    'yoga'
];

var lewdCelebList = [
    'alison brie',
    'celebrity',
    'kate upton',
    'lindsay lohan',
    'megan fox',
    'model',
    'sasha gray',
    'scarlet johanson',
    'super model'
];

var lewdCommandList = {
    'salute': 'nbc police salute',
    'keyboard': 'ron jeremy keyboard',
    'celery man': 'celery man',
    'tayne': 'nude tayne'
};

var lewdHype = [
    'LEWD HYPE :dickbutt:',
    'HYPETRAIN :snowsplode: :eggplant: '
];

// Listeners

controller.hears('^lewdme!$', 'ambient', function(bot, message) {return getLewdGiphy(bot, message)});
controller.hears('^lewdme! (.*)$', 'ambient', function(bot, message) {return getSpecificGiphy(bot, message)});

// Functions

function getSpecificGiphy(bot, message) {
    var command = message.match[1];
    var searchTerms = lewdCommandList[command];

    if (_.isEmpty(searchTerms)) {
        bot.reply(message, 'Invalid Lewd Command.');
    } else {
        var src = {response_url: 'http://api.giphy.com/v1/gifs/search?q=' + searchTerms + '&api_key=dc6zaTOxFJmzC&limit=125', channel: message.channel};
        bot.replyPublicDelayed(src, {}, function(res) {return getSpecificGiphyCallback(res, message)});
    }
}

function getSpecificGiphyCallback(res, message) {
    var gif = res.data[0];
    bot.reply(message, isValidGif(gif) ? getGifURL(gif) : 'No image available.');
}

function getLewdGiphy(bot, message) {
    var searchTerms = getLewdTerms();
    var offset = _.random(0, 500);
    var src = {response_url: 'http://api.giphy.com/v1/gifs/search?q=' + searchTerms + '&api_key=dc6zaTOxFJmzC&limit=125&rating=r&offset=' + offset, channel: message.channel};

    bot.replyPublicDelayed(src, {}, function(res) {return getLewdGiphyCallback(res, message, searchTerms)});
}

function getLewdGiphyCallback(res, message, searchTerms) {
    var gifs = getLewdestGifs(res.data);
    var num = _.random(0, (gifs.length || 100) - 1)
    var gif = gifs[num];

    if (isValidGif(gif)) {
        getHype(message);
        bot.reply(message, 'Search: ' + searchTerms);
        bot.reply(message, getGifURL(gif));
    } else {
        getLewdGiphy(bot, message);
    }
}

function getLewdTerms() {
    var maxTermCount = 5;
    var randomNumMax = lewdTerms.length - 1;
    var searchTerms = [];
    var lewdPerson = '';

    while(searchTerms.length < maxTermCount) {
        searchTerms = getRandomTerm(searchTerms, maxTermCount, randomNumMax);
    }

    if(_.includes(searchTerms, 'lewdPerson')) {
        var personNum = _.random(0, lewdCelebList.length - 1);
        lewdPerson = lewdCelebList[personNum];
    }

    return searchTerms.join(' ').replace('lewdPerson', lewdPerson);
}

function getRandomTerm(searchTerms, maxTermCount, randomNumMax) {
    var num = _.random(0, randomNumMax)
    var term = lewdTerms[num];

    if (!_.includes(searchTerms, term)) {
        searchTerms.push(term)
    }

    return searchTerms;
}

function getLewdestGifs(data) {
    var lewdest = _.filter(data, {rating: 'r'});

    if (!lewdest.length) {
        lewdest = _.filter(data, {rating: 'pg-13'});
    }

    return lewdest.length ? lewdest : data;
}

function getGifURL(gif) {
    return gif.images.fixed_height.url || gif.images.fixed_width.url
}

function isValidGif(gif) {
    return _.isObject(gif) && gif.images && (gif.images.fixed_height || gif.images.fixed_width);
}

function getHype(message) {
    var hypeRoll = _.random(1, 100);
    var hypeHit = 50;

    if (_.isEqual(hypeRoll, hypeHit)) {
        var hypeNum = _.random(0, lewdHype.length - 1)
        var hypeMessage = lewdHype[hypeNum];
        var hypeTrain = _.repeat(hypeMessage, 52);
        bot.reply(message, hypeTrain);
    }
}
