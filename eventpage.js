
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



