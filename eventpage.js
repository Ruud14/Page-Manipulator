
// Have the badge display 'off' by default.
chrome.browserAction.setBadgeText({text:"Off"});

// Listen for requests.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    // Change the value of the badge.
    if(request.todo == "SetBadge")
    {
        chrome.browserAction.setBadgeText({text:request.value});
    }
})

// Context menu for copying the CSS path of an element on the page.
let CopyCSSMenuItem = {
    "id": "copyCSSpath",
    "title": "Copy CSS path to clipboard",
    "contexts": ["selection","page"]
};

// Create the contextmenu.
chrome.contextMenus.create(CopyCSSMenuItem);

// Add functionallity to the context menu.
chrome.contextMenus.onClicked.addListener(function(clickdata)
{
    if(clickdata.menuItemId == "copyCSSpath")
    {
        // Send message to content script to get the element of what was clicked on.
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {todo: "getClickedEl"});
        });
    }
})

// Function that sends a message to the frontent that the active tap has changed.
function sendActiveTabChangedMessage(tabId)
{
    chrome.tabs.sendMessage(tabId, {todo: "activeTabChanged"});
}

// Update the badge when switching active browser tabs.
chrome.tabs.onActivated.addListener(function(activeInfo) {
    sendActiveTabChangedMessage(activeInfo.tabId);
});

// Update the badge when (re)loading a web page.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    sendActiveTabChangedMessage(tabId);
});
