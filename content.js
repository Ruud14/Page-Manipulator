window.onload = function statup()
{
    main();
}

function main()
{
    // send message to give the popup permission to show up.
    chrome.runtime.sendMessage({todo:"showpage"});
    // listen for requests.
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
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
    })
    
}
