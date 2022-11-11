// Load() needs to be run both before, and after the page is loaded.
// Otherwise the original page is shown before CSS manipulations.
// This doesn't add two manipulations that are the same 
// because the 'manipulate' function checks if the manipulation is already present;
load();

// Bool that indicates whether the page is loaded.
let page_loaded = false;
// Array that consists of ['filename', element] pairs.
let added_css = [];
// Arrays that consists of 'filenames'.
let added_js = [];
// Array that consists of ['filename', element, position] pairs.
let added_html = [];

window.onload = function statup()
{
    page_loaded = true;
    main();
    load();
}

// Function that processes all the retrieved data from storage.
// It will manipulate the page if that is necessary. 
function load_data_from_storage_and_manipulate(data)
{
    let url = location.href;
    let filenames = Array.from(Object.keys(data));
    let filedatas = Array.from(Object.values(data));
    for(let i = 0; i<filenames.length; i++)
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
        let todo = "change" + kind;

        // Remove empty lines from active_websites
        while(active_websites.includes(""))
        {
            let index = active_websites.lastIndexOf("");
            active_websites.splice(index, 1);
        }

        // Complete incomplete urls
        for(let site of active_websites)
        {
            if(!(site.startsWith("https://")||site.startsWith("http://"))&&site.toLowerCase()!="all")
            {
                if(site.startsWith("www."))
                {
                    site1 =  "https://" + site;
                    site2 =  "http://" + site; 
                    site3 = "https://" + site.slice(4);
                    site4 = "http://" + site.slice(4);
                }
                else
                {
                    site1 = "https://www." + site;
                    site2 = "http://www." + site;
                    site3 = "https://" + site;
                    site4 = "http://" + site;
                }
                active_websites.push(site1);
                active_websites.push(site2);
                active_websites.push(site3);
                active_websites.push(site4);
            }
        }

        // Create the request for the manipulation.
        let request = {
            todo: todo, 
            code: filetext, 
            position:position, 
            mode:mode, 
            filename:filename, 
            active:active, 
            reload_on_remove:reload_on_remove};

        // Check if the code should run on ALL pages.
        if(active_websites.includes("all"))
        {
            manipulate(request, false);
        }

        // Check if the current website is in active_websites according to the recursive mode.
        if(mode === "recursive")
        {
            for(let site of active_websites)
            {
                if(url.startsWith(site))
                {
                    manipulate(request, false);
                    break;
                }
            }
        }
        // Check if the current website is in active_websites according to the exact mode.
        else if(mode === "exact")
        {
            if(active_websites.includes(url) || active_websites.includes(url.slice(0, -1)))
            {
                manipulate(request, false);
            }
        }
    }   
}

// Makes sure the event target is present on the page.
// When there isn't an event target present initially, it will be created and the callback will be called in the onload.
function require_event_target(callback) {
    // Check if event target creator is present.
    var event_target_creator = document.getElementById("page-manipulator-event-target-creator")
    // If not, add event target creator
    if(event_target_creator === null){
        event_target_creator = document.createElement('script');
        event_target_creator.setAttribute("id", "page-manipulator-event-target-creator");
        event_target_creator.src = chrome.runtime.getURL('receiver.js');
        event_target_creator.onload = function() {
            callback()
        };
        document.head.appendChild(event_target_creator);
    } else {
        // Get the event target
        var event_target = document.getElementById("page-manipulator-event-target")
        if (event_target === null) {
            throw "event_target not ready."
        }
        callback()
    }
}

// Function that loads both the synced and local storage.
function load()
{
    function check_for_js_file(data, yes, no) {
        // Check if there is any javascript file.
        file_is_js = (element) => ((element["filename"].substring(element["filename"].lastIndexOf(".") + 1, element["filename"].length)).toUpperCase()) == "JS";
        has_js_file = Array.from(Object.values(data)).some(file_is_js)
        if (has_js_file) {
            require_event_target(function () {
                yes()
            })
        } else {
            no()
        }
    }

    // Load the synced data.
    chrome.storage.sync.get(null, function(data) {
        check_for_js_file(data, function () {
            load_data_from_storage_and_manipulate(data);
            // Load the local data.
            chrome.storage.local.get(null, function(data2) {
                load_data_from_storage_and_manipulate(data2);
            });
        }, function () {
            load_data_from_storage_and_manipulate(data);
            // Load the local data.
            chrome.storage.local.get(null, function(data2) {
                check_for_js_file(data2, function() {
                    load_data_from_storage_and_manipulate(data2);
                }, function () {
                    load_data_from_storage_and_manipulate(data2);
                })
            });
        });
    });
}

// Checks if a file is active or not.
function get_status(filename)
{
    if(filename.endsWith(".css"))
    {
        for(let element of added_css)
        {
            if(element[0] === filename)
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
            if(element[0] === filename)
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
            if(element === filename)
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

// Removes a manipulation for the page.
function remove_manipulation(request)
{
    // Remove CSS element.
    if(request.todo ==="removeCSS")
    {
        for(let element of added_css)
        {
            if(element[0] === request.value)
            {
                let index = added_css.indexOf(element);
                element[1].remove();
                added_css.splice(index, 1);
                break;
            }
        }
    }
    // Remove HTML element.
    else if(request.todo === "removeHTML")
    {
        for(let element of added_html)
        {
            if(element[0] === request.value)
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
                added_html.splice(index, 1);
                break;
            }
        }
    }
    // Remove JavaScript element.
    else if(request.todo === "removeJS")
    {
        for(let element of added_js)
        {
            if(element === request.value)
            {
                let index = added_js.indexOf(element);
                
                // Get the event target
                var event_target = document.getElementById("page-manipulator-event-target")

                // Send remove request to listener.
                var event = new CustomEvent("remove-manipulation", {'detail': {
                    filename: request.value
                }});
                event_target.dispatchEvent(event);

                added_js.splice(index, 1);
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
    // Manipulate HTML.
    if(request.todo ==="changeHTML" && (page_loaded||update))
    {
        // Check if the requested HTML element is alread injected into the page.
        // If so, change the innerHTML to be the new code.
        let alreadyInjected = false;
        for(const element of Array.from(added_html))
        {
            if(element[0] === request.filename)
            {
                alreadyInjected = true;
                // Remove the old element and add a new one, if the position of the injected html changed.
                if(request.position !== element[2])
                {
                    // Remove the old element.
                    remove_request = {todo:"removeHTML", value:request.filename}
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
                break;
            }
        }
        // The requested HTML element hasn't been injected into this page before.
        if(!alreadyInjected)
        {
            // Inject the new HTML element into the page if the HTML element wasn't alread present on the page.
            let page_manipulator = document.createElement("page-manipulator-" + request.filename.split('.')[0]);
            page_manipulator.innerHTML = request.code;
            added_html.push([request.filename, page_manipulator, request.position]);
            let body = document.body;
            
            switch(request.position)
            {
                case "bottom":
                    body.insertAdjacentHTML("beforeEnd", page_manipulator.outerHTML);
                    break;
                case "top":
                    body.insertAdjacentHTML("afterBegin", page_manipulator.outerHTML);
                    break;
                case "replace":
                    body.innerHTML= page_manipulator.outerHTML;
                    break;
            }
        }
        
    }
    // Manipulate CSS
    else if(request.todo === "changeCSS" && (!page_loaded || update))
    {
        // Check if requested CSS has alread been injected.
        // If so change the css of the injection to the new code.
        let alreadyInjected = false;
        for(const element of Array.from(added_css))
        {
            if(element[0] === request.filename)
            {
                alreadyInjected = true;
                element[1].childNodes[0].nodeValue = request.code;
                break;
            }
        }
        
        // Inject the requested CSS if the requested injection isn't already present on the page.
        if(!alreadyInjected)
        {
            let head = document.head;
            let style = document.createElement("style");
            style.type = "text/css";
            style.appendChild(document.createTextNode(request.code));
            head.appendChild(style);
            let array_item = [request.filename, style];
            added_css.push(array_item);
        }
    }
    // Manipulate JavaScript
    else if(request.todo ==="changeJS" && (page_loaded||update))
    {
        // Injects the user created javascript by sending it to the event target.
        function injectUserCode() {
            // Get the event target
            var event_target = document.getElementById("page-manipulator-event-target")

            let alreadyInjected = false;
            for(const element of Array.from(added_js))
            {
                if(element === request.filename)
                {
                    alreadyInjected = true;
                    // Remove the old JS script from the page and inject the new JS into the page.
                    remove_request = {todo:"removeJS", value:request.filename};
                    remove_manipulation(remove_request);
                    manipulate(request, true);
                    break;
                }
            }
            // Add the new JS to the page if it wasn't already on there.
            if(!alreadyInjected)
            {
                // Send event to event target.
                var event = new CustomEvent("manipulate", {'detail': {
                    code: request.code,
                    filename: request.filename
                }});
                event_target.dispatchEvent(event);
                added_js.push(request.filename);  
            }
        }

        injectUserCode();        
    }
}

// Main function that initiates all the event listeners for incoming messages and mouse presses.
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
                    path = current_elem.nodeName.toLowerCase() + " " + path;
                }
                else
                {
                    let classname = current_elem.className;
                    if(classname.includes(" "))
                    { 
                        classname = classname.replace(new RegExp(" ", 'g'), ".");
                    }
                    path = "." + classname + " " + path;
                }
                if(current_elem.parentNode === null)
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
                    path = "#" + id + " " + path;
                }
            }
            clickedEl = path;
        }
    }, true);
    
    // Add the listener for incoming messages.
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
        else if(["removeCSS", "removeJS", "removeHTML"].includes(request.todo))
        {
            if (request.todo == "removeJS") {
                require_event_target(function(){ remove_manipulation(request)});
            } else {
                remove_manipulation(request);
            }
            update_badge(); 
        }
        if(["changeHTML", "changeCSS", "changeJS"].includes(request.todo))
        {
            if (request.todo == "changeJS") {
                require_event_target(function(){ manipulate(request, true)});
            } else {
                manipulate(request, true);
            }
            update_badge(); 
        }
        else if(request.todo === "activeTabChanged")
        {
            update_badge(); 
        }
    });
}

// Wait for element on the page to be present.
function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
