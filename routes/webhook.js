/**
 * This whole thing is just for bootstrapping during development. It should not
 * be needed in production.
 */

const express = require('express');
const router = express.Router();
const request = require('request');

router.get('/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === process.env.MESSENGER_VALIDATION_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
router.post('/', function (req, res) {
  var data = req.body;
  console.log('req.body', req.body);

  // Make sure this is a page subscription
  if (data.object == 'page') {
    console.log('data.object', data.object);
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;
      console.log('pageID', pageID);
      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        console.log('messagingEvent', messagingEvent);
        // TODO: This is mostly bootstraping for testing purposes. Could be stripped later
        if (messagingEvent.message.text == 'syn') {
          console.log('messagingEvent.message.text', messagingEvent.message.text);
          request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
            method: 'POST',
            json: {
              recipient: {
                id: messagingEvent.sender.id
              },
              message: {
                attachment: {
                  type: "template",
                  payload: {
                    template_type: "button",
                    text: "This is test text",
                    buttons:[{
                      type: "web_url",
                      url: "https://storieswithdata.work",
                      title: "Open Web URL",
                      webview_height_ratio: "full",
                      messenger_extensions: true,
                    }]
                  }
                }
              }
            }

          }, function (error, response, body) {
            console.log('error', error);
            console.log('response', response);
            console.log('body', body);
            if (!error && response.statusCode == 200) {
              var recipientId = body.recipient_id;
              var messageId = body.message_id;

              if (messageId) {
                console.log("Successfully sent message with id %s to recipient %s",
                  messageId, recipientId);
              } else {
              console.log("Successfully called Send API for recipient %s",
                recipientId);
              }
            } else {
              console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            }
          });
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.

  }
  res.sendStatus(200);
});

module.exports = router;
