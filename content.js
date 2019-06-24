load();
let page_loaded = false;
let added_css = [];
window.onload = function statup()
{
    page_loaded = true;
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
                let req = {todo: todo, code: filetext, position:position, mode:mode, title:filename}
                manipulate(req,false);
            }
            else if(mode === "recursive")
            {
                for(let x=0;x<url.length;x++)
                {
                    let substring = url.substring(0,x);
                    if(active_websites.includes(substring))
                    {
                        let req = {todo: todo, code: filetext, position:position, mode:mode, title:filename}
                        manipulate(req,false);
                        break;
                    }
                } 
            }
            else if(mode === "exact")
            {
                if(active_websites.includes(url))
                {
                    let req = {todo: todo, code: filetext, position:position, mode:mode, title:filename}
                    manipulate(req,false);
                }
            }
        }   
    });
}

function manipulate(request, update)
{
    if(request.todo==="changeHTML" && (page_loaded||update))
    {
        let body = document.body;
        switch(request.position)
        {
            case "bottom":
                body.insertAdjacentHTML('beforeEnd',request.code);
                break;
            case "top":
                body.insertAdjacentHTML('afterBegin',request.code);
                break;
            case "replace":
                body.innerHTML= request.code;
                break;
        }
    }
    // Adds a new <style> for every saved .css script for the active website.
    else if(request.todo ==="changeCSS" && (!page_loaded || update))
    {
        //chrome.runtime.sendMessage({todo:"insertCSS",code:request.code});
        // old method:
        let found_elements = [];
        added_css.forEach(function(element)
        {
            if(element[0]===request.title)
            {
                found_elements.push(request.title);
                element[1].childNodes[0].nodeValue = request.code;
            }
        })
        
        if(!found_elements.includes(request.title))
        {
            let head = document.head;
            let style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(request.code));
            head.appendChild(style);
            let array_item = [request.title,style]
            added_css.push(array_item);
        }
    }
    else if(request.todo ==="changeJS" && (page_loaded||update))
    {
        //chrome.runtime.sendMessage({todo:"insertJS",code:request.code});
        // old method:
        
        let head = document.head;
        let script = document.createElement('script');
        script.textContent = request.code;
        head.appendChild(script);
        added_js = script;
        script.remove();   
    }
}

function main()
{
    var clickedEl = null;
    var selectedEl = null;
    // Gets the element that was clicked on.
    document.addEventListener("mousedown", function(event){
        //right click
        if(event.button == 2) { 
            let current_elem = event.target;
            let path = "";
            
            while(current_elem.id === "")
            {
                if(current_elem.className === "")
                {
                    path = current_elem.nodeName.toLowerCase()+" "+path;
                }
                else
                {
                    let classname = current_elem.className
                    if(classname.includes(" "))
                    { 
                        classname = classname.replace(new RegExp(" ", 'g'), ".");
                    }
                    path = "."+classname+" "+path;
                }
                if(current_elem.parentNode===null)
                {
                    break;
                }
                current_elem = current_elem.parentNode;
            }
            if(current_elem.id != "")
            {
                let id = current_elem.id;
                if(id.includes(" "))
                {
                    id = id.split(" ")[0];
                }
                path = "#"+id+ " "+ path;
            }
            clickedEl = path;
            
        }
    }, true);
    // Saves the clicked on element to the clipboard.
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if(request == "getClickedEl") {
            navigator.clipboard.writeText(clickedEl);
        }
        if(request == "getSelectedEl") {
            navigator.clipboard.writeText(selectedEl);
        }
    });

    // send message to give the popup permission to show up.
    chrome.runtime.sendMessage({todo:"showpage"});
    // listen for requests.
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
    {
        manipulate(request,true);
    })
    
}
