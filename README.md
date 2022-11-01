Migration to manifest V3 (if possible)

Injecting dynamic javascript code from `content.js` seems to have become difficult if not impossible. This is what we're currently doing in manifest V2. 
Injecting dynamic javascript from `popup.js` is possible using chrome.scripting API world.
Injecting javascript from a file from `content.js` is possible using `script.src = chrome.runtime.getURL('script.js');`.

Something worth trying:
1. Create a script.js file, that has a listener to which strings can be sent.
2. That listener should, on receival of a string, inject that string as a script into the current page.
3. This script.js should be injected in every page the user visits, then strings can be sent to the listener to inject code from popup.js.