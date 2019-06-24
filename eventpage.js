
// listen to requests.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    if(request.todo=="showpage")
    {
        show_page();
    }
    // old method:
    // else if(request.todo =="insertCSS")
    // {
    //     chrome.tabs.insertCSS(null, {code:request.code, allFrames:false, runAt:"document_start"});
    // }
})

//Allows the popup to show up.
function show_page()
{
    chrome.tabs.query({active:true,currentWindow:true}, function(tabs)
    {
        chrome.pageAction.show(tabs[0].id);
    })
}


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
    // if(clickdata.menuItemId=="copyCSSpath" && clickdata.selectionText)
    // {
    //     // Send message to content script to get the element of what was selected.
    //     chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    //         chrome.tabs.sendMessage(tabs[0].id, "getSelectedEl", function(clickedEl) {});  
    //     });
    // }
    if(clickdata.menuItemId=="copyCSSpath")
    {
        // Send message to content script to get the element of what was clicked on.
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, "getClickedEl", function(clickedEl) {});  
        });
        
    }
})

// chrome.storage.onChanged.addListener(function(changes, storageName){
//     chrome.browserAction.setBadgeText({"text": changes.total.newValue.toString()});
// });



