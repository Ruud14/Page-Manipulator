# Page Manipulator.

Project status: not finished

WARNING: This project was created in a short period of time and definitely isn't perfect (yet :D)!
This works on most sites, but there are some exceptions!
If you'd like to see any specific improvements or found any bugs, let me know in the "issues".

**Chrome Extension to inject HTML, CSS or JavaScript any web-page.**
Inject HTML, CSS or JavaScript to your favorite web-pages.
Have the changes you make be saved and applied everytime you visit the specified website.

Better than 'inspect element' because It will stay after a reload :D


**How to install?**
Currently, since it is still work in progress, you have to load it as an unpacked extension.
If you don't know how to do this, here are the steps.
- Download all these files and put them in to a folder.
- Open your chrome browser and click on the 3 dots in the top right corner.
- Go to: "More Tools" > "Extensions".
- Enable developer mode in the top right corner.
- Click "Load unpacked" in the top left corner and select the folder.
- Enjoy :D

This will soon be in the chrome extensions store.
for free, of course :D

**Functionalities**
- Have HTML, CSS and/or Javascript automatically added to all pages or the pages you specify.
- Run custom CSS **Before** the page is fully loaded so you won't see the origial page first.
- Inject Javascript on the go.
- Add/Remove/Change the HTML and CSS on the go.
- Right click on any element on a page to get the full CSS path.
- Automatically save and sync the scripts you make.

**Fun use cases**:
- Cheat simple games like the t-rex game.
- Fool your friends by showing them something fake on a website.
- Make your own dark-theme for any website.
- Test a website you're working on.
- Whatevery you can imagine, be creative :D

**It doesn't work, what now?**:
If the extension button in the top right corner is greyed-out, you can't use it on that page.
- For Javascript:
    - Make sure your code is run at the right moment. Maybe try adding a delay.
    - Check the chrome console for error messages. 

- For CSS:
    - Make sure you are are manipulating the right element. by using "inspect element".
    - Try using '!important'.
- For HTML:
    - Make sure you haven't accidentally set the 'position' dropdown to the wrong position.

**What I learned:**
- The process of making extensions.
- Basics of JavaScript.
- Chrome storage and messaging API.


The editor I used since the second release is Ace editor.
Check it out here: https://ace.c9.io/


