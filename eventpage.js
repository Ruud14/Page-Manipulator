
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

function insert(todo,code,position,mode)
// todo shoud be > changeHTML, changeCSS or changeJS
{
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
    {
        chrome.tabs.sendMessage(tabs[0].id, {todo: todo, code: code, position:position, mode:mode})
    })
    
}
// When the url changes, check if there are any scripts that are set to modify the page. If so, activate them.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) 
{
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        var url = tabs[0].url;

        chrome.storage.sync.get(null, function(data) {
            //populate the array.
            let filenames = Array.from(Object.keys(data));
            let filedatas = Array.from(Object.values(data))
            for(let i =0;i<filenames.length;i++)
            {
                let file_data = filedatas[i];
                let filename = file_data["filename"];
                let filetext = file_data["text"];
                let position = file_data["position"];
                let mode = file_data["mode"];
                let active_websites = file_data["active_websites"].split('\n');
                let kind = (filename.substring(filename.lastIndexOf(".") + 1, filename.length)).toUpperCase();
                let todo = 'change'+kind;
                //Remove empty lines from active_websites
                while(active_websites.includes(""))
                {
                    let index = active_websites.lastIndexOf("");
                    active_websites.splice(index,1);
                }

                if(active_websites.includes("all"))
                {
                    insert(todo,filetext,position,mode);
                }
                else if(mode === "recursive")
                {
                    for(let x=0;x<url.length;x++)
                    {
                        let substring = url.substring(0,x);
                        if(active_websites.includes(substring))
                        {
                            insert(todo,filetext,position,mode);
                            break;
                        }
                    } 
                }
                else if(mode === "exact")
                {
                    if(active_websites.includes(url))
                    {
                        insert(todo,filetext,position,mode);
                    }
                }

    
            }
            
        });
    });
    
});
show_page();
