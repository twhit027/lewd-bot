/*LEWD-BOT*/

// Initialization
'use strict';

var Botkit = require('./lib/Botkit.js');
var _ = require('lodash');
var os = require('os');
var bluebird = require('bluebird');
var couchbase = require('couchbase');
var cluster = new couchbase.Cluster('couchbase://127.0.0.1');
var bucket = cluster.openBucket('default');

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
    'katy perry',
    'lindsay lohan',
    'megan fox',
    'model',
    'sasha gray',
    'scarlet johanson',
    'super model',
    'gigi hadid'
];

var lewdCommandList = {
    'salute': 'http://media2.giphy.com/media/Ki9S8uve2xWx2/200.gif',
    'keyboard': 'http://media4.giphy.com/media/97fLl2sV4di48/200.gif',
    'celery man': 'https://media1.giphy.com/media/YfO8X3PfSmuyY/200.gif',
    'ocean man': [
        'http://media3.giphy.com/media/RKdm8JW9KkJtC/200.gif',
        'https://www.youtube.com/watch?v=6E5m_XtCX3c'
    ],
    'man man man': 'https://www.youtube.com/watch?v=oECIKVaz5rc'
};

var lewdHype = [
    'LEWD HYPE :dickbutt: ',
    'HYPETRAIN :snowsplode: :eggplant: '
];

// Listeners

controller.hears('^lewdme!$', 'ambient', function(bot, message) {return getLewdGiphy(bot, message)});
controller.hears('^lewdme! (.*)$', 'ambient', function(bot, message) {return getSpecificGiphy(bot, message)});
controller.hears('^lewdbomb!(.*)?$', 'ambient', function(bot, message) {return getLewdBomb(bot, message)});
controller.hears('^unlewd!(.*)?$', 'ambient', function(bot, message) {return makeFlacid(bot, message)});

// Functions

function getLewdBomb(bot, message) {
    var lewdSize = {
        a: 2,
        b: 4,
        c: 6,
        dd: 8
    };
    var lewdCommand = message.match[1] && _.trimStart(message.match[1].toLowerCase());
    var lewdCount = lewdSize[lewdCommand];
    
    if (lewdCount) {
        for (var i=0; i<lewdCount; i++) {
            getLewdGiphy(bot, message);
        }
    } else {
        var lewdSizes = _.keys(lewdSize).join(', ').toUpperCase();
        bot.reply(message, 'lewdbomb! sizes: ' + lewdSizes);
    }


}

function makeFlacid(bot, message) {
    var flacidId = message.match[1] && _.trimStart(message.match[1].toLowerCase());

    getFlacidIds()
    .then(function(existingFlacidIds) {
        var flacidIdExists = _.includes(existingFlacidIds, flacidId);

        if (flacidIdExists) {
            bot.reply(message, flacidId + ' already exists in flaccid list.');
        } else if (!/^[a-zA-Z0-9]*$/.test(flacidId)) {
            bot.reply(message, flacidId + ' is not a valid id.');
        }
        else {
            var newFlacidIds = existingFlacidIds.concat(flacidId);

            bucket.upsert('flacidIds', newFlacidIds, function(err, result) {
                if (err) throw err;
                bot.reply(message, 'Added ' + flacidId + ' to flaccid list.');
            });
        }
    });
}

function getSpecificGiphy(bot, message) {
    var command = message.match[1];
    var data = lewdCommandList[command];

    if (_.isEmpty(data)) {
        var commands = _.keys(lewdCommandList).join(', ');
        bot.reply(message, 'Valid Lewd Commands: ' + commands);
    } else {
        if (_.isArray(data)) {
            _.each(data, function(item) {
                bot.reply(message, item);
            })

        } else {
            bot.reply(message, data);
        }
    }
}

function getLewdGiphy(bot, message) {
    var searchTerms = getLewdTerms();
    var offset = _.random(0, 500);
    var src = {response_url: 'http://api.giphy.com/v1/gifs/search?q=' + searchTerms + '&api_key=dc6zaTOxFJmzC&limit=125&rating=r&offset=' + offset, channel: message.channel};

    bot.replyPublicDelayed(src, {}, function(res) {return getLewdGiphyCallback(res, message, searchTerms)});
}

function getLewdGiphyCallback(res, message, searchTerms) {
    var gifs = getLewdestGifs(res.data)
    .then(function(gifs) {
        var num = _.random(0, (gifs.length || 100) - 1)
        var gif = gifs[num];

        if (isValidGif(gif)) {
            getHype(message);
            bot.reply(message, {
                text: getGifURL(gif),
                attachments: [
                    {
                        text: 'Gif ID: ' + gif.id,
                    }
                ]
            });
        } else {
            getLewdGiphy(bot, message);
        }
    });


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
    return filterFlacid(data)
    .then(function(noFlaccid) {
        var lewdest = _.filter(noFlaccid, {rating: 'r'});

        if (!lewdest.length) {
            lewdest = _.filter(noFlaccid, {rating: 'pg-13'});
        }

        return lewdest.length ? lewdest : noFlaccid;
    });    
}

function getGifURL(gif) {
    return gif.images.original.url || gif.images.fixed_height.url || gif.images.fixed_width.url
}

function isValidGif(gif) {
    return _.isObject(gif) && gif.images && (gif.images.fixed_height || gif.images.fixed_width);
}

function filterFlacid(gifs) {
    return getFlacidIds()
    .then(function(flacidIds) {
        return _.filter(gifs, function(gif) {
            return !_.includes(flacidIds, gif.id.toLowerCase().toString());
        });
    });
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

function getFlacidIds() {
    return new bluebird(function(resolve, reject) {
        return bucket.get('flacidIds', function(err, result) {
            if (err && err.code == 13){
                return resolve([]);
            }
            return resolve(result.value);
        });
    })
}
