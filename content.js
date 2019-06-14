
window.onload = function statup()
{
    
    main();
    load();
}


function load()
{
    chrome.storage.sync.get(null, function(data) {
        //populate the array.
        let url = location.href;
        console.log(url);
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
                let req = {todo: todo, code: filetext, position:position, mode:mode}
                manipulate(req);
            }
            else if(mode === "recursive")
            {
                for(let x=0;x<url.length;x++)
                {
                    let substring = url.substring(0,x);
                    if(active_websites.includes(substring))
                    {
                        let req = {todo: todo, code: filetext, position:position, mode:mode}
                        manipulate(req);
                        break;
                    }
                } 
            }
            else if(mode === "exact")
            {
                if(active_websites.includes(url))
                {
                    let req = {todo: todo, code: filetext, position:position, mode:mode}
                    manipulate(req);
                }
            }
        }   
    });
}

function manipulate(request)
{
    if(request.todo==="changeHTML")
    {
        let body = document.body;
        if(request.position === "top")
        {
            body.innerHTML= request.code + body.innerHTML;
        }
        else if(request.position === "bottom")
        {
            body.innerHTML+= request.code;
        }
        else if(request.position ===  "replace")
        {
            body.innerHTML= request.code;
        }
    }
    else if(request.todo ==="changeCSS")
    {
        let head = document.head;
        let style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(request.code));
        head.appendChild(style);
    }
    else if(request.todo ==="changeJS")
    {
        let head = document.head;
        let script = document.createElement('script');
        script.textContent = request.code;
        head.appendChild(script);
        script.remove();
    }
}

function main()
{
    // send message to give the popup permission to show up.
    chrome.runtime.sendMessage({todo:"showpage"});
    // listen for requests.
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
    {
        manipulate(request);
    })
    
}
