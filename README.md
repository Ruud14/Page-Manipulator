# Page Manipulator.


WARNING: This extension works on most sites, but there are some exceptions!
If you'd like to see any specific improvements or found any bugs, let me know [here](https://github.com/Ruud14/Page-Manipulator/issues).

**Browser Extension to inject HTML, CSS or JavaScript any web-page.**
Inject HTML, CSS or JavaScript into your favorite web-pages.
Have the changes you make be saved and applied everytime you visit the specified website(s).

**Better than 'inspect element' because It will stay after reloading the page.**


[![Page Minipulator Chrome Extension](https://i.imgur.com/KtHuzBM.png)](https://www.youtube.com/watch?v=_-FCWwC9XQA "Page Minipulator - Chrome Extension")

**How to install?**

***Chrome:***

Install it from the chrome extension store [here](https://chrome.google.com/webstore/detail/page-manipulator/mdhellggnoabbnnchkeniomkpghbekko).

Or follow the steps below.
- Clone this repository.
- Open your chrome browser and click on the 3 dots in the top right corner.
- Go to: "More Tools" > "Extensions".
- Enable developer mode in the top right corner.
- Click "Load unpacked" in the top left corner and select the cloned directory.

***Microsoft Edge:***

Install it from the Microsoft extension store [here](https://microsoftedge.microsoft.com/addons/detail/page-manipulator/hfhjgoiepgnobooahplnlfcbgaakilib).

Or follow the steps below.
- Clone this repository.
- Open your Microsoft edge browser and click on the 3 dots in the top right corner.
- Click "Extensions".
- Enable developer mode in the bottom left corner.
- Click "Load unpacked extension" in the center of the screen and select the cloned directory.

**How to use?**
- Simple, First open the extension.
- Choose 'JavaScript', 'CSS' or 'HTML'.
- Create a new file by pressing 'new'.
- Write your own code or get some from the examples [here](https://github.com/Ruud14/Page-Manipulator/tree/master/examples).
- Press the manipulate button to test your code.
- To make sure your code is run everytime you visit a specific page do the following:
    - Put the urls of the websites in the 'active websites' input.
    - Check the 'active' checkbox.
    - reload the page to make sure it works.

- Button functionalities:
    - The 'Reload' Button:
        - Will Reload the current page.
    - The 'Active' checkbox:
        - on > The code will be run automatically on the pages specified in the 'Active websites' textarea.
        - off > The code will only run when you press the 'Manipulate' button.
    - The 'Active Websites' textarea:
        - You can specify the websites you want your code to run on here.
    - The 'Matching Pages' dropdown:
        - 'Exact' > The code will only run when the url of the page is exactly the same as one of the urls in the 'Active Websites' textarea. (Including slashes at the end!)
        - 'Recursive' > The code will also run on all sub-pages of the specified urls in the 'Active Websites'.
    - The 'Position on page' dropdown (HTML only):
        - 'Top' > The HTML will be added to the top of the page.
        - 'Bottom' > The HTML will be added to the bottom of the page.
        - 'Replace' > The html will replace the entire body HTML of the page.
    - The 'Manipulate' or 'Update Manip.' button:
        - Injects the code into the page or updates the injection.
        - This button also works when the 'Active' checkbox is unchecked.
    - The 'Remove Manip.' Button:
        - Removes the manipulation from the page.
        - If the "Auto ⟳" checkbox is checked, the page will automatically reload after pressing the 'Remove Manip.' button. The 'active' checkbox will also be unchecked.
    - The 'Delete' button:
        - Deletes the current file from the extension storage.
- **You can right click any element on a page to get the css path of that element.**

**Functionalities**
- Automatically inject custom HTML, CSS and/or Javascript every time you visit one of the websites you specified.
- Run custom CSS **Before** the page is fully loaded so you won't see the origial page first.
- Inject Javascript on the go.
- Add/Remove/Change the HTML and CSS on the go.
- Right click on any element on a page to get the full CSS path.
- Automatically saves the changes you make.
    - Files that contain less than 8000 characters are synced across your google account.
    - Files that contain 8000 or more characters are stored locally.

**Fun use cases**:
- Make your own dark-theme for any website.
- Test a website you're working on.
- Cheat simple games like the t-rex game.
- Fool your friends by showing them something fake on a website.
- Whatever you can imagine, be creative :D

**It doesn't work, what now?**:
- If the extension button in the top right corner is greyed-out, you can't use it on that page.
- Make sure the 'active' checkbox is checked. And the 'active websites' input contains the correct urls.
- For Javascript:
    - Make sure your code is run at the right moment. Maybe try adding a delay.
    - Check the chrome console for error messages. 

- For CSS:
    - Make sure you are are manipulating the right element. by using "inspect element".
    - Try using ['!important'](https://www.educative.io/edpresso/what-is-the-important-property-in-css).

- For HTML:
    - Make sure you haven't accidentally set the 'position' dropdown to the wrong position.

**What I learned:**
- The process of making extensions.
- Basics of JavaScript.
- Chrome storage and messaging API.


The editor I used since the second release is Ace editor.
Check it out here: https://ace.c9.io/


