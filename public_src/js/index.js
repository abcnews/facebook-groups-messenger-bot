
// Default share method is broadcast. Change to current_thread when we know we can.
let shareMethod = 'broadcast';

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
    // TODO: Do we need to handle this error better?
  }, err => console.log(err));
});

Array.prototype.forEach.call(document.querySelectorAll('a'), el => el.addEventListener('click', handleClick));

// Handle clicks on stories
function handleClick (event) {

  event.preventDefault();
  event.stopPropagation();

  let dataset = event.target.dataset;
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
            url: event.target.getAttribute('href')
          },
          buttons: [
            {
              type: "web_url",
              url: event.target.getAttribute('href'),
              title: "Read the story"
            }
          ]
        }]
      }
    }
  };

  MessengerExtensionsPromise.then(function(MessengerExtensions) {
    MessengerExtensions.beginShareFlow(
      function success(response) {
        if (response.is_sent) {
          MessengerExtensions.requestCloseBrowser();
        }
      },
      function error(errorCode, errorMessage) {
        // TODO: How to notify the user of a failure at this point?
      },
      payload,
      shareMethod
    );
  });
}
