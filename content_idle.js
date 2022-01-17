var mediator = document.body;

mediator.addEventListener("bridgeRequest", function(e) {
    var req = e.detail.req;
    var tag = e.detail.tag;

    chrome.extension.sendRequest(req, function(response) {
        var event = new CustomEvent("bridgeResponse", {
            detail: {
                res: response,
                // req: req,
                tag: tag
            }
        });
        mediator.dispatchEvent(event);
    });

}, false);
