
// Default share method is broadcast. Change to current_thread when we know we can.
let shareMethod = 'broadcast';

// Logging
window._LTracker = window._LTracker || [];
window._LTracker.push({
  logglyKey: process.env.LOGGLY_KEY,
  sendConsoleErrors: true,
  tag: 'facebook-groupshare'
});


// A promise for the loaded messenger extensions
let MessengerExtensionsPromise = new Promise(function(resolve, reject) {
  window.extAsyncInit = function() {
    resolve(window.MessengerExtensions);
  }
});

// Change to current_thread for sharing if supported.
MessengerExtensionsPromise.then(function(MessengerExtensions) {
  MessengerExtensions.getSupportedFeatures(function success(result) {
    if (result.supported_features.indexOf('sharing_direct') > -1) {
      shareMethod = 'current_thread';
    }
    // TODO: Redirect to app upgrade prompt
  }, (err, msg) => {
    window._LTracker.push({
      code: err,
      message: msg
    });
    console.error(err, msg);
  });
});

Array.prototype.forEach.call(document.querySelectorAll('a'), el => el.addEventListener('click', handleClick));

// Handle clicks on stories
function handleClick (event) {

  event.preventDefault();
  event.stopPropagation();

  let dataset = event.currentTarget.dataset;
  let url = event.currentTarget.getAttribute('href') + '?=smid=FB_M|News&WT.tsrc=Facebook_Messenger';
  let payload = {
    attachment: {
      type:"template",
      payload: {
        template_type: "generic",
        elements: [{
          title: dataset.shortTeaserTitle,
          image_url: dataset.image,
          subtitle: dataset.shortTeaserText,
          default_action: {
            type: "web_url",
            url: url
          },
          buttons: [
            {
              type: "web_url",
              url: url,
              title: "Read the story"
            }
            // {
            //   type: "web_url",
            //   url: "https://fbmessenger.abcnewsdigital.com/groupshare",
            //   title: "Share another story",
            //   webview_height_ratio: "full",
            //   messenger_extensions: true,
            //   fallback_url: "https://fbmessenger.abcnewsdigital.com/fallback"
            // }
          ]
        }]
      }
    }
  };

  MessengerExtensionsPromise.then(function(MessengerExtensions) {
    MessengerExtensions.beginShareFlow(
      function success(response) {
        window._LTracker.push({
          url: url,
          title: dataset.shortTeaserTitle,
          method: shareMethod,
          response: response
        });
        if (response.is_sent === true || response.is_sent === 'true' /* Facebook bug */)  {
          MessengerExtensions.requestCloseBrowser();
        }
      },
      function error(errorCode, errorMessage) {
        // TODO: How to notify the user of a failure at this point?
        window._LTracker.push({
          code: errorCode,
          message: errorMessage
        });
        console.error(errorCode, errorMessage);
      },
      payload,
      shareMethod
    );
  });
}
