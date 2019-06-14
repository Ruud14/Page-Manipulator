
// listen to requests.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    if(request.todo=="showpage")
    {
        show_page();
    }
})

//Allows the popup to show up.
function show_page()
{
    chrome.tabs.query({active:true,currentWindow:true}, function(tabs)
    {
        chrome.pageAction.show(tabs[0].id);
    })
}


show_page();
