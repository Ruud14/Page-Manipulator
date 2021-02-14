
// Have the popup display off by default.
chrome.browserAction.setBadgeText({text:"Off"});
// Listen to requests.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    // Change the value of the badge.
    if(request.todo=="SetBadge")
    {
        chrome.browserAction.setBadgeText({text:request.value});
    }
})

let CopyCSSMenuItem = {
    "id": "copyCSSpath",
    "title": "Copy CSS path to clipboard",
    "contexts": ["selection","page"]
};
let InsertHTMLMenuItem = {
    "id": "insertHTML",
    "title": "insert HTML here",
    "contexts": ["selection","page"]
};
chrome.contextMenus.create(CopyCSSMenuItem);
//chrome.contextMenus.create(InsertHTMLMenuItem);

chrome.contextMenus.onClicked.addListener(function(clickdata)
{

    if(clickdata.menuItemId=="copyCSSpath")
    {
        // Send message to content script to get the element of what was clicked on.
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            //chrome.tabs.sendMessage(tabs[0].id, "getClickedEl", function(clickedEl) {});  
            chrome.tabs.sendMessage(tabs[0].id, {todo: "getClickedEl"});
        });
        
    }
})

function sendActiveTabChangedMessage(tabId)
{
    chrome.tabs.sendMessage(tabId, {todo: "activeTabChanged"});
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
    sendActiveTabChangedMessage(activeInfo.tabId);
});
