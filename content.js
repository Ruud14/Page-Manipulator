load();
let page_loaded = false;
// Arrays that consists of ['filename',element] pairs.
let added_css = [];
let added_js = [];
// Array that consists of ['filename', element, position] pairs.
let added_html = [];
window.onload = function statup()
{
    page_loaded = true;
    main();
    load();
}

function load_data_from_storage(data)
{
    //populate the array.
    let url = location.href;
    let filenames = Array.from(Object.keys(data));
    let filedatas = Array.from(Object.values(data))
    for(let i =0;i<filenames.length;i++)
    {
        let file_data = filedatas[i];
        let filename = file_data["filename"];
        let filetext = file_data["text"];
        let position = file_data["position"];
        let active = file_data["active"];
        let reload_on_remove = (file_data["reload_on_remove"]) ? false : file_data["reload_on_remove"];
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

        if(active_websites.includes("all"))
        {
            let req = {todo: todo, code: filetext, position:position, mode:mode, filename:filename, active:active, reload_on_remove:reload_on_remove}
            manipulate(req,false);
        }

        // Check if the current website is in active_websites according to the mode.
        if(mode === "recursive")
        {
            for(let site of active_websites)
            {
                if(url.startsWith(site))
                {
                    let req = {todo: todo, code: filetext, position:position, mode:mode, filename:filename, active:active, reload_on_remove:reload_on_remove}
                    manipulate(req,false);
                    break;
                }
            }
        }
        else if(mode === "exact")
        {
            if(active_websites.includes(url))
            {
                let req = {todo: todo, code: filetext, position:position, mode:mode, filename:filename, active:active, reload_on_remove:reload_on_remove}
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
        for(let element of added_html)
        {
            if(element[0]===filename)
            {
                return true;
            }
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

// Checks if there are any active manipulations.
// Change the badge to "On" if there are any.
// Change the badge to "Off" if there are none.
function update_badge()
{
    if(added_html.length + added_css.length + added_js.length === 0)
    {
        chrome.runtime.sendMessage({todo:"SetBadge", value:"Off"});
    }
    else
    {
        chrome.runtime.sendMessage({todo:"SetBadge", value:"On"});
    }
}

// Remove a manipulation for the page.
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
        for(let element of added_html)
        {
            if(element[0]===request.value)
            {
                // Since HTML injections are done using insertAdjacentHTML, we can't just do element[1].remove().
                // Instead we must get the tag name of the injected element and consequently remove all elements with that tag name.
                let index = added_html.indexOf(element);
                let tagName = element[1].tagName;
                var real_elements = document.getElementsByTagName(tagName);
                for(let real_el of real_elements)
                {
                    real_el.remove();
                }
                added_html.splice(index,1);
                break;
            }
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
}


// Manipulates the page.
function manipulate(request, update)
{
    // Return if the requested manipulation is not set to be active.
    if(request.active === false && !update)
    {
        return;
    }
    if(request.todo==="changeHTML" && (page_loaded||update))
    {
        // Check if the requested HTML element is alread injected into the page.
        // If so, change the innerHTML to be the new code.
        let found_elements = [];
        added_html.forEach(function(element, i)
        {
            if(element[0]===request.filename)
            {
                found_elements.push(request.filename);
                // Remove the old element and add a new one, if the position of the injected html changed.
                if(request.position !== element[2])
                {
                    // Remove the old element.
                    remove_request = {todo:"removeHTML",value:request.filename}
                    remove_manipulation(remove_request);
                    // Add the new element.
                    manipulate(request, true);
                }
                else
                {
                    // Since HTML injections are done using insertAdjacentHTML, we can't just change element[1].innerHTML.
                    // Instead we must get the tag name of the injected element and consequently change all elements with that tag name.
                    let tagName = element[1].tagName;
                    var real_elements = document.getElementsByTagName(tagName);
                    for(let real_el of real_elements)
                    {
                        real_el.innerHTML = request.code;
                    }
                }
            }
        })
        if(found_elements.length === 0)
        {
            // Inject the new HTML element into the page if the HTML element wasn't alread present on the page.
            let page_manipulator = document.createElement('page-manipulator-'+request.filename.split('.')[0]);
            page_manipulator.innerHTML = request.code;
            added_html.push([request.filename, page_manipulator, request.position])
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
        
    }
    else if(request.todo ==="changeCSS" && (!page_loaded || update))
    {
        
        // Check if requested CSS has alread been injected.
        // If so change the css of the injection to the new code.
        let found_elements = [];
        added_css.forEach(function(element)
        {
            if(element[0]===request.filename)
            {
                found_elements.push(request.filename);
                element[1].childNodes[0].nodeValue = request.code;
            }
        })
        
        // Inject the requested CSS if the requested injection isn't already present on the page.
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
        // Add the new JS to the page if it wasn't already on there.
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
            // Remove the old JS script from the page and inject the new JS into the page.
            remove_request = {todo:"removeJS",value:request.filename}
            remove_manipulation(remove_request);
            manipulate(request, true);
        }
    }
}

function main()
{
    var clickedEl = null;
    var selectedEl = null;
    // Adds a listener for right clicking on elements on the page.
    document.addEventListener("mousedown", function(event){
        // Copy the css path of the clicked element into the clipboard.
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
    
    // Add the listener for messages.
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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
            update_badge(); 
        }
        else if(["removeCSS","removeJS","removeHTML"].includes(request.todo))
        {
            remove_manipulation(request);
            update_badge(); 
        }
        if(["changeHTML","changeCSS","changeJS"].includes(request.todo))
        {
            manipulate(request,true);
            update_badge(); 
        }
        else if(request.todo === "activeTabChanged")
        {
            update_badge(); 
        }
        
    });
}
