// This script is injected in the page to handle javascript injections.
// In manifest v3 it is no longer possible to inject arbitrary user-written JS into the page easily.
// That is why we're currently always injecting this script first.
// This script creates an event target that listens for manipulation events. 
// Such an event can be triggered by the extension to inject custom user-written JS.

// Array that consists of ['filename', element] pairs.
let added_js = [];

// Create a DOM EventTarget object
var target = document.createElement('span');
target.setAttribute("id", "page-manipulator-event-target");

// Pass EventTarget interface calls to DOM EventTarget object
target.addEventListener = target.addEventListener.bind(target);
target.removeEventListener = target.removeEventListener.bind(target);
target.dispatchEvent = target.dispatchEvent.bind(target);

// Add the 'manipulate' listener to the target.
target.addEventListener("manipulate", function(e) {
    let head = document.head;
    let script = document.createElement("script");
    script.textContent = e.detail.code;
    head.appendChild(script);
    added_js.push([e.detail.filename, script]);
    return true;
});

// Add the 'remove-manipulation' listener to the target.
target.addEventListener("remove-manipulation", function(e) {
    for(let element of added_js)
    {
        if(element[0] === e.detail.filename)
        {
            let index = added_js.indexOf(element);
            element[1].remove();
            added_js.splice(index, 1);
            break;
        }
    }
    return true;
});

// Add the target to the DOM.
document.head.appendChild(target);


