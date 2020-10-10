load();
let page_loaded = false;
// Array that consists of ['filename'.css,node] pairs.
let added_css = [];
let added_js = [];
window.onload = function statup()
{
    page_loaded = true;
    main();
    load();
    update_badge();
}

function load_data_from_storage(data)
{
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
        let active = file_data["active"];
        let mode = file_data["mode"];
        let active_websites = file_data["active_websites"].split('\n');
        let kind = (filename.substring(filename.lastIndexOf(".") + 1, filename.length)).toUpperCase();
        let todo = 'change'+kind;
        // Complete incomplete urls
        for(let site of active_websites)
        {
            if(!(site.startsWith("https://")||site.startsWith("http://"))&&site.toLowerCase()!="all")
            {
                if(site.startsWith("www."))
                {
                    site1 =  "https://"+site;
                    site2 =  "http://"+site; 
                    site3 = "https://"+site.slice(4);
                    site4 = "http://"+site.slice(4);
                }
                else
                {
                    site1 = "https://www."+site;
                    site2 = "http://www."+site;
                    site3 = "https://"+site;
                    site4 = "http://"+site;
                }
                active_websites.push(site1);
                active_websites.push(site2);
                active_websites.push(site3);
                active_websites.push(site4);
            }
        }
        //Remove empty lines from active_websites
        while(active_websites.includes(""))
        {
            let index = active_websites.lastIndexOf("");
            active_websites.splice(index,1);
        }
        if(active_websites.includes("all"))
        {
            let req = {todo: todo, code: filetext, position:position, mode:mode, filename:filename, active:active}
            manipulate(req,false);
        }
        else if(mode === "recursive")
        {
            for(let site of active_websites)
            {
                if(url.startsWith(site))
                {
                    let req = {todo: todo, code: filetext, position:position, mode:mode, filename:filename, active:active}
                    manipulate(req,false);
                    break;
                }
            }
        }
        else if(mode === "exact")
        {
            if(active_websites.includes(url))
            {
                let req = {todo: todo, code: filetext, position:position, mode:mode, filename:filename, active:active}
                manipulate(req,false);
            }
        }
    }   
}

function load()
{
    // Load the synced data.
    chrome.storage.sync.get(null, function(data) {
        load_data_from_storage(data);
    });

    // Load the local data.
    chrome.storage.local.get(null, function(data) {
        load_data_from_storage(data);
    });

}
// checks if a file is active or not.
function get_status(filename)
{
    if(filename.endsWith(".css"))
    {
        for(let element of added_css)
        {
            if(element[0]===filename)
            {
                return true;
            }
        }
        return false;
    }
    else if(filename.endsWith(".html"))
    {
        let html_elements = document.getElementsByTagName('page-manipulator-'+filename.split('.')[0]);
        if(html_elements.length != 0)
        {
            return true;
        }
        return false;
    }
    else if(filename.endsWith(".js"))
    {
        for(let element of added_js)
        {
            if(element[0]===filename)
            {
                return true;
            }
        }
        return false;
    }
}

function update_badge()
{
    let found_elements = false;
    for(let element of added_css)
    {
        if(element.active)
        {
            found_elements = true;
        }   
    }
    if(!found_elements)
    {
        chrome.runtime.sendMessage({todo:"SetBadge", value:"Off"});
    }
}

function remove_manipulation(request)
{
    if(request.todo==="removeCSS")
    {
        for(let element of added_css)
        {
            if(element[0]===request.value)
            {
                let index = added_css.indexOf(element);
                element[1].remove();
                added_css.splice(index,1);
                break;
            }
        }
    }
    else if(request.todo === "removeHTML")
    {
        let html_elements = document.getElementsByTagName('page-manipulator-'+request.value.split('.')[0]);
        for(let element of html_elements)
        {
            element.remove();
        }
    }
    else if(request.todo === "removeJS")
    {
        for(let element of added_js)
        {
            if(element[0]===request.value)
            {
                let index = added_js.indexOf(element);
                element[1].remove();
                added_js.splice(index,1);
                break;
            }
        }
    }
    update_badge();
}


// Manipulates the page.
function manipulate(request, update)
{
    if(request.active === false && !update)
    {
        return;
    }
    chrome.runtime.sendMessage({todo:"SetBadge", value:"On"});
    if(request.todo==="changeHTML" && (page_loaded||update))
    {
        let html_elements = document.getElementsByTagName('page-manipulator-'+request.filename.split('.')[0]);
        if(html_elements.length === 0)
        {
            let page_manipulator = document.createElement('page-manipulator-'+request.filename.split('.')[0]);
            page_manipulator.innerHTML = request.code;
            let body = document.body;
            
            
            switch(request.position)
            {
                case "bottom":
                    body.insertAdjacentHTML('beforeEnd',page_manipulator.outerHTML);
                    break;
                case "top":
                    body.insertAdjacentHTML('afterBegin',page_manipulator.outerHTML);
                    break;
                case "replace":
                    body.innerHTML= page_manipulator.outerHTML;
                    break;
            }
        }
        else
        {
            for(let element of html_elements)
            {
                element.innerHTML = request.code;
            }
        }
        
    }
    // Adds a new <style> for every saved .css script for the active website.
    else if(request.todo ==="changeCSS" && (!page_loaded || update))
    {
        
        let found_elements = [];
        added_css.forEach(function(element)
        {
            if(element[0]===request.filename)
            {
                found_elements.push(request.filename);
                element[1].childNodes[0].nodeValue = request.code;
            }
        })
        
        if(!found_elements.includes(request.filename))
        {
            let head = document.head;
            let style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(request.code));
            head.appendChild(style);
            let array_item = [request.filename,style]
            added_css.push(array_item);
        }
    }
    else if(request.todo ==="changeJS" && (page_loaded||update))
    {
        let found_elements = [];
        added_js.forEach(function(element)
        {
            if(element[0]===request.filename)
            {
                found_elements.push(request.filename);
            }
        })
        if(!found_elements.includes(request.filename))
        {
            let head = document.head;
            let script = document.createElement('script');
            script.textContent = request.code;
            head.appendChild(script);
            added_js.push([request.filename,script]);  
        }
        else
        {
            remove_request = {todo:"removeJS",value:request.filename}
            remove_manipulation(remove_request);
            let head = document.head;
            let script = document.createElement('script');
            script.textContent = request.code;
            head.appendChild(script);
            added_js.push([request.filename,script]);  
        }
    }
}

function main()
{
    var clickedEl = null;
    var selectedEl = null;
    // Gets the element that was clicked on.
    document.addEventListener("mousedown", function(event){
        //right click
        if(event.button === 2) { 
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
                if(id != null)
                {
                    if(id.includes(" "))
                    {
                        id = id.split(" ")[0];
                    }
                    path = "#"+id+ " "+ path;
                }
            }
            clickedEl = path;
            
        }
    }, true);
    
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        // Saves the clicked on element to the clipboard.
        if(request.todo === "getClickedEl") {
            navigator.clipboard.writeText(clickedEl);
        }
        else if(request.todo === "getSelectedEl") {
            navigator.clipboard.writeText(selectedEl);
        }
        else if(request.todo === "getStatus")
        {
            let resp = get_status(request.value);
            sendResponse({response:resp});
        }
        else if(["removeCSS","removeJS","removeHTML"].includes(request.todo))
        {
            remove_manipulation(request);
        }
        if(["changeHTML","changeCSS","changeJS"].includes(request.todo))
        {
            // send message to change the badge to display "On"
            manipulate(request,true);
        }
        
    });    
}
