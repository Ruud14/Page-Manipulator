window.onload = function statup()
{
    // Enable to clear the storage.
    // chrome.storage.sync.clear();
    // chrome.storage.local.clear();
    main()
    
}

// ---------------------------- General functions ----------------------------


// Inserts code into the current site.
function insert(todo,code,position,mode,filename)
// todo shoud be > changeHTML, changeCSS or changeJS
{
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
    {
        chrome.tabs.sendMessage(tabs[0].id, {todo: todo, code: code, position:position,mode:mode,filename:filename});
    })
    
}
// shows msg on the screen
function show_message(msg)
{
    let message_text = document.getElementById("message-text");
    message_text.textContent = msg;
    message_text.style.opacity = 1;
    window.setTimeout(function(){ message_text.style.opacity = 0;},1000);
}
// Returns the filetype of the specified filename in the "FILEEXTENSION" format.
function filename_to_kind(filename)
{
    return (filename.substring(filename.lastIndexOf(".") + 1, filename.length)).toUpperCase();
}
// Converts name of the language based on the file extension.
function kind_to_language(kind)
{
    if(kind === "JS"){
        return "JavaScript";
    }
    else{
        return kind;
    }
}

// Get string lenght of a javascript object.
function get_file_size(file_object)
{
    let stringification = JSON.stringify(file_object);
    return stringification.length;
}

// Function that checks if communication between the the front and backend code is possible.
// It will run the onFail function if communication is not possible.
// This function will be running recursively until communication is possible.
function communication_test(onFail, onSuccess, retryTimeMiliSeconds=500)
{
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
    {
        chrome.tabs.sendMessage(tabs[0].id, {todo:"comTest"}, function(response) {
            // The extension is opened on a page that it can't manipulate.
            if(chrome.runtime.lastError) {
                if(chrome.runtime.lastError.message === "Could not establish connection. Receiving end does not exist."){
                    onFail();
                    console.log("Boohoo");
                    setTimeout(function(){communication_test(onFail, onSuccess, retryTimeMiliSeconds)}, retryTimeMiliSeconds);
                }
                else{
                    console.log("YEE");
                    onSuccess();
                } 
            }
            else{
                console.log("YEE2");
                onSuccess();
            }

        });
    });
}

// ------------------------------------------------------------------------

// controlls the edit window
class Editor
{
    constructor(navigator)
    {
        this.files = [];
        this.max_open_files = 6;
        this.active_file = "none";
        this.previous_file = "none";
        this.navigator = navigator;
        this.max_synced_filesize_chars = 8000;
        
        this.editor = ace.edit("editor");
        this.editor.getSession().setMode("ace/mode/javascript");
        this.editor.setTheme("ace/theme/terminal");
        this.EditSession = require("ace/edit_session").EditSession;
        this.editor_element = document.getElementById("editor");
        this.editor_element.style.display = "none";
      
    }
    
    // Opens a new editor window if the file doesn't exist yet. 
    // and opens the file if it aleady exists.
    open_file(filename, text)
    {
        let all_open_filenames = [];
        for(let element of this.files)
        {
            all_open_filenames.push(element[0]);
        }
        // check if the file isn't already open.
        if(all_open_filenames.includes(filename))
        {
            this.activate_file_by_name(filename);
        }
        else
        {
            // Check if the maximum amount of open files isn't already reached.
            if(this.files.length < this.max_open_files)
            {
                this.create_window(filename,text);
                this.create_file_button(filename);
                this.activate_file_by_name(filename);
            }
            else
            {
                alert("Close some files first.");
            }
        }
    }
    // Opens the editor window of the file with the specified filename.
    activate_file_by_name(filename)
    {
        this.active_file = filename;
        for(let element of this.files)
        {
            if(element[0] === filename)
            {
                let index = this.navigator.get_nav_item_index_by_filename(filename)
                this.navigator.nav_items[index].open = true;
                this.editor.setSession(element[1]);
                this.editor_element.style.display = "block";
                // Focus on the textarea after opening a file.
                document.getElementsByClassName("ace_text-input")[0].focus();
                break;
            }
        }
        this.make_button_active(filename);
    }
    // Make the active window button look darker to make it the obvious open file.
    make_button_active(filename)
    {
        let all_buttons = document.getElementsByClassName("file-title-button");
        let all_close_buttons = document.getElementsByClassName("close-button");
        Array.from(all_buttons).forEach(function(element)
        {
            // make the button active
            if(element.value===filename)
            {
                element.style.opacity = 1;
                all_close_buttons[Array.from(all_buttons).indexOf(element)].style.opacity = 1;
            }
            // make the other buttons inactive.
            else
            {
                element.style.opacity = 0.5;
                all_close_buttons[Array.from(all_buttons).indexOf(element)].style.opacity = 0.5;
            }
        })
        // Resize all open file buttons to fit the window.
        this.resize_open_file_buttons();
        
    }
    // Changes the width of the open file buttons to fit the extension window.
    resize_open_file_buttons()
    {
        let all_buttons = document.getElementsByClassName("file-title-button");
        let editor_width_str = this.editor_element.style["min-width"];
        let button_width = Math.round((parseInt(editor_width_str.substring(0, editor_width_str.length - 2))-20)/all_buttons.length);
        // Also take the with of the close buttons into a count.
        button_width = button_width-3*all_buttons.length;
        Array.from(all_buttons).forEach(function(element)
        {
            console.log(editor_width_str);
            console.log(button_width);
            element.style.width = button_width+"px";
        })
    }
    // Hides the editor and the open files.
    hide()
    {
        // Hide the editor element.
        this.editor_element.style.display = "none";
        // Hide all open files. This basically closes all the files without saving. 
        // So after reopening the extension, the files will be open again.
        let all_open_files = document.getElementsByClassName("open-files-list-item");
        //close all the files.
        Array.from(this.navigator.nav_items).forEach(function(element){
            element.open = false;
        })
        //Delete the file buttons.
        Array.from(all_open_files).forEach(function(element)
        {
            element.parentNode.removeChild(element);
        })
        // Clear the files list.
        this.files = [];
    }
    reveal()
    {
        // reveal the editor element.
        this.editor_element.style.display = "block";
    }

    // Closes the editor of the file with the specified filename.
    close_file(filename)
    {
        let all_open_files = document.getElementsByClassName("open-files-list-item");
        //Set the file to being closed
        let index = this.navigator.get_nav_item_index_by_filename(filename);
        this.navigator.nav_items[index].open = false;
        
        this.save_file_by_name(filename);
        //Delete the file button.
        Array.from(all_open_files).forEach(function(element)
        {
            if(element.childNodes[0].value === filename)
            {
                element.parentNode.removeChild(element);
            }
        })
        
        // Remove the file from this.files.
        for(let i=0; i<this.files.length;i++)
        {
            if(this.files[i][0] === filename)
            {
                this.files.splice(i,1);
            }
        }
        // If you close the last open file, the editmenu will go away and be replaced with the main menu.
        if(this.files.length === 0)
        {
            this.editor_element.style.display = "none";
            this.navigator.disable_all_menus();
            this.navigator.enable_menu_of_kind("MAIN");
        }
        else
        {
            // open an other file thats open.
            this.activate_file_by_name(this.files[0][0]);
            this.navigator.disable_all_menus();
            this.navigator.enable_menu_of_kind("EDITOR");
        }
    }
    // Creates a navigation menu for a file with the specified name.
    create_file_button(filename)
    {   
        let ul = document.getElementById("open-files-list");
        let li = document.createElement("li");
        let file_button = document.createElement("input");
        let close_button = document.createElement("a");
        li.className = "open-files-list-item";
        close_button.innerHTML = "x";
        close_button.className = "close-button"
        close_button.onclick = function()
        {
            this.close_file(filename);
        }.bind(this);
        file_button.type="submit";
        file_button.className="file-title-button";
        file_button.value=filename;
        file_button.onclick = function()
        {
            this.activate_file_by_name(filename);
            this.save_current_file();
            this.navigator.disable_all_menus();
            this.navigator.enable_menu_of_kind("EDITOR");
        }.bind(this);
        li.appendChild(file_button);
        li.appendChild(close_button);
        ul.appendChild(li);
        this.make_button_active(filename);
    }
    // Creates a editor window for the file with the specified name and text.
    create_window(filename,text)
    {
        let new_session = new this.EditSession(text);

        // Disable the info text on the left.
        if(filename_to_kind(filename)==="HTML")
        {
            new_session.setUseWorker(false);
        }
        if(filename.endsWith(".js"))
        {
            new_session.setMode("ace/mode/javascript");
        }
        else if(filename.endsWith(".css"))
        {
            new_session.setMode("ace/mode/css");
        }
        else if(filename.endsWith(".html"))
        {
            new_session.setMode("ace/mode/html");
        }
        new_session.on('change', function(delta) {
            this.save_current_file();
            if(this.navigator.current_menu != "EDITOR")
            {
                this.navigator.disable_all_menus();
                this.navigator.enable_menu_of_kind("EDITOR");
            }
        }.bind(this));
        this.files.push([filename,new_session]);
        
    }
    // Returns the text of the current edit menu.
    get_current_text()
    {
        let current_text = this.editor.session.getValue();
        return current_text;

    }
    // Returns the the filetype in "FILEEXTENSION" format.
    // "JS" for javascript.
    // "CSS" for Cascading Style Sheets.
    // "HTML" for HyperText Markup Language.
    get_current_filetype()
    {
        if(this.active_file.endsWith(".js")){
            return "JS";
        }
        else if(this.active_file.endsWith(".css")){
            return "CSS";
        }
        else if(this.active_file.endsWith(".html")){
            return "HTML";
        }
    }
    // Deletes the currently active file from storage.
    delete_current_file()
    {
        let filename = this.active_file;
        this.close_file(filename);
        chrome.storage.sync.remove(filename,function(){});
        chrome.storage.local.remove(filename,function(){});
        show_message("Deleted "+filename);
    }
    save_file_by_name(filename)
    {
        let all_new_data = {};
        let current_file_data = {};
        current_file_data.filename =filename;

        for(let element of this.files)
        {
            if(element[0]===filename)
            {
                let current_text = element[1].getValue();
                current_file_data.text = current_text;
                break;
            }
        }
        let index = this.navigator.get_nav_item_index_by_filename(filename);
        
        current_file_data.active_websites = this.navigator.nav_items[index].active_websites;
        current_file_data.position = this.navigator.nav_items[index].position;
        current_file_data.mode = this.navigator.nav_items[index].mode;
        current_file_data.active = this.navigator.nav_items[index].active;
        current_file_data.reload_on_remove = (this.navigator.nav_items[index].reload_on_remove === undefined) ? false : this.navigator.nav_items[index].reload_on_remove;
        current_file_data.open = this.navigator.nav_items[index].open;
        current_file_data.last = (this.active_file === filename);

        all_new_data[filename] = current_file_data;

        // Update the synced storage if the file size is small enough. 
        // Update the local storage otherwise.
        if (get_file_size(all_new_data) >=  this.max_synced_filesize_chars)
        {
            chrome.storage.sync.remove(filename,function(){});
            chrome.storage.local.set(all_new_data, function() {
                show_message("Saved!");
            });
        }
        else
        {
            chrome.storage.local.remove(filename,function(){});
            chrome.storage.sync.set(all_new_data, function() {
                show_message("Saved!");
            });
        }
    }
    // Saves the current file and it's properties to the storage.
    save_current_file()
    {
        let current_file_name = this.active_file;
        let current_text = this.get_current_text();
        let checked = this.navigator.active_checkbox.checked;
        let reload_on_remove = this.navigator.reload_on_remove_checkbox.checked;
        let active_websites = this.navigator.enabled_sites_text_area.value;
        let position = this.navigator.position_selection.options[this.navigator.position_selection.selectedIndex].value;
        let mode = this.navigator.mode_selection.options[this.navigator.mode_selection.selectedIndex].value;
        let all_new_data = {};
        
        let current_file_data = {};
        current_file_data.filename =current_file_name;
        current_file_data.text = current_text;
        current_file_data.active_websites = active_websites;
        current_file_data.position = position;
        current_file_data.mode = mode;
        current_file_data.active = checked;
        current_file_data.reload_on_remove = (reload_on_remove === undefined) ? false : reload_on_remove;

        // Checks if the file was open or not.
        let index = this.navigator.get_nav_item_index_by_filename(current_file_name);
        
        current_file_data.open = this.navigator.nav_items[index].open;
        current_file_data.last = true;

        all_new_data[current_file_name] = current_file_data;

        // Update the synced storage if the file size is small enough. 
        // Update the local storage otherwise.
        if (get_file_size(all_new_data) >=  this.max_synced_filesize_chars)
        {
            chrome.storage.sync.remove(current_file_name,function(){});
            chrome.storage.local.set(all_new_data, function() {
                show_message("Saved!");
            });
        }
        else
        {
            chrome.storage.local.remove(current_file_name,function(){});
            chrome.storage.sync.set(all_new_data, function() {
                show_message("Saved!");
            });
        }

        // Update '.last' when you switch files.
        if(this.previous_file != this.active_file)
        {
            this.previous_file = this.active_file;
            this.update_last_open_file();
        }
    }
    update_last_open_file()
    {
        // Save all open files because '.last' can only be true on one, so the rest needs to be set to false. 
        for(let element of this.files)
        {
            this.save_file_by_name(element[0]);
        }
    }
}

// 
class File
{
    constructor(input, filename, text, active_websites, position, mode, active, reload_on_remove, open, last)
    {
        this.filename = filename; 
        this.text = text; // Contains the content of the file.
        this.navigator = navigator; // Contains the navigation.
        this.active_websites = active_websites // Contains all pages that the could should run on.
        this.position = position; // Determines the position where the injection should take place.
        this.mode= mode; //Determines if the script should be run only on the exact specified page (exact) or also on sub-pages (recursive).
        this.element = input; // The button of the file.
        this.active = active; // Determines if the file should be run when the specified pages are loaded.
        this.reload_on_remove = (reload_on_remove === undefined) ? false : reload_on_remove; // Determines if the page should reload after removing the manipulation.
        this.open = open; //Determines is open or not.
        this.last = last; //Determines if this is the file that was last open.
        this.kind = filename_to_kind(filename);
    }
}

// Controlls the navigation through the menus.
class Navigation
{
    constructor()
    {
        // Getting all the html elements.
        this.navbar = document.getElementById("navbar");
        this.back_button = document.getElementById("back-button");
        this.back_div = document.getElementById("back-div");
        this.reload_button = document.getElementById("reload-button");
        this.new_button = document.getElementById("new-button");
        this.js_button = document.getElementById("JS-button");
        this.css_button = document.getElementById("CSS-button");
        this.html_button = document.getElementById("HTML-button");
        this.try_button = document.getElementById("try-button");
        this.remove_try_button = document.getElementById("remove-try-button");
        this.reload_on_remove_checkbox = document.getElementById("reload-on-remove-checkbox");
        this.make_button = document.getElementById("make-button");
        this.delete_button = document.getElementById("delete-button");
        this.filename_textfield = document.getElementById("filename-textfield");
        this.enabled_sites_text_area = document.getElementById("enabled-sites-text-area");
        this.position_selection = document.getElementById("position-selection");
        this.mode_selection = document.getElementById("mode-selection");
        this.active_label = document.getElementById("active-label");
        this.active_websites_label = document.getElementById("active-websites-label");
        this.matching_pages_label = document.getElementById("matching-pages-label");
        this.position_label = document.getElementById("position-label");
        this.filename_input_label = document.getElementById("filename-input-label");
        this.active_checkbox = document.getElementById("active-checkbox");
        this.info_text = document.getElementById("info-text");
        this.error_text = document.getElementById("error-text");
        this.language_selection_label = document.getElementById("language-selection-label");
        this.menu_title_label = document.getElementById("menu-title-label");

        this.zoom_out_button = document.getElementById("zoom-out-button");
        this.zoom_percentage_label = document.getElementById("zoom-percentage-label");
        this.zoom_in_button = document.getElementById("zoom-in-button");

        this.editor = new Editor(this);
        this.current_menu = "MAIN";
        this.current_zoom_level = 0;
        if(localStorage["current_zoom_level"])
        {
            this.set_zoom_factor(parseInt(localStorage["current_zoom_level"]));
        }

        // These arrays only contain the items that are always there.
        this.main_nav_items = [this.js_button,this.css_button,this.html_button, this.info_text, this.language_selection_label];
        this.editor_menu_items = [this.back_div,this.try_button,this.active_websites_label, this.enabled_sites_text_area,this.matching_pages_label,this.mode_selection,this.delete_button];
        this.new_menu_items = [this.make_button,this.filename_textfield,this.back_div,this.filename_input_label, this.info_text]; 
        this.nav_items =[];
        this.bind_buttons();
        this.disable_all_menus();
        // Test if communication with the backend is possible.
        // Enable the 'ERROR' menu if this isn't the case.
        communication_test(
            function(){this.enable_menu_of_kind("ERROR")}.bind(this), //onFail
            function(){this.enable_menu_of_kind("MAIN")}.bind(this));//onSuccess
        setTimeout(function() {this.load_open_files();}.bind(this), 100);
    }
    // binds the correct functions to the buttons.
    // This method should only be run once -> by the constructor.
    bind_buttons()
    {
        // Autosave when changing the "active" checkbox.
        this.active_checkbox.onchange = function(){ 
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    // Only allow the active checkbox to be checked when there are active websites specified.
                    if(this.nav_items[index].active_websites.replaceAll(/\s/g, "") === "" && this.active_checkbox.checked === true)
                    {
                        alert("You must first specify the active websites in the 'active websites' textarea. If you want this manipulation to be active on all webistes, put 'all' into the 'active websites' textarea.");
                        this.active_checkbox.checked = false;
                    }
                    else
                    {
                        this.nav_items[index].active = this.active_checkbox.checked;
                        this.editor.save_current_file();
                    }
                }
            }
        }.bind(this);

        // function for autosaving when changing the position.
        let position_change_function = function()
        {
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].position = this.position_selection.options[this.position_selection.selectedIndex].value;
                    this.editor.save_current_file();
                }
            }
        }.bind(this);

        // Autosave when changing the position.
        this.position_selection.onkeyup = position_change_function;
        this.position_selection.onchange = position_change_function;

        // function for autosaving when changing the mode.
        let mode_change_function = function()
        {
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].mode = this.mode_selection.options[this.mode_selection.selectedIndex].value;
                    this.editor.save_current_file();
                }
            }
        }.bind(this);

        // Autosave when changing the mode.
        this.mode_selection.onkeyup = mode_change_function;
        this.mode_selection.onchange = mode_change_function;

        // function for autosaving when changing the 'active sites' textarea.
        let active_sites_textarea_change_function = function()
        {
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].active_websites = this.enabled_sites_text_area.value;
                    this.editor.save_current_file();
                }
            }
        }.bind(this);

        let active_sites_textarea_leave_function = function()
        {
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].active_websites = this.enabled_sites_text_area.value;
                    if(this.enabled_sites_text_area.value.replaceAll(/\s/g,"") === "" && this.active_checkbox.checked === true)
                    {
                        this.nav_items[index].active = false;
                        this.active_checkbox.checked = false;
                    }
                    this.editor.save_current_file();
                }
            }
        }.bind(this)

        // Autosave when changing the 'active sites' textarea.
        this.enabled_sites_text_area.onkeyup = active_sites_textarea_change_function;
        this.enabled_sites_text_area.onchange = active_sites_textarea_leave_function;

        // Change the page to the javascript page.
        this.js_button.onclick = function()
        {   
            //enable all the saved javascript files.
            this.enable_menu_of_kind("JS");
        }.bind(this);

        // Change the page to the CSS page.
        this.css_button.onclick = function()
        {   
            //enable all the saved javascript files.
            this.enable_menu_of_kind("CSS");
        }.bind(this);

        // Change the page to the HTML page.
        this.html_button.onclick = function()
        {   
            //enable all the saved HTML files.
            this.enable_menu_of_kind("HTML");
        }.bind(this);
        // Reload the page.
        this.reload_button.onclick = function()
        {
            let filename = this.editor.active_file;
            chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
            {
                this.editor.save_current_file();
                let kind = filename_to_kind(filename);
                // Remove the manipulation first.
                chrome.tabs.sendMessage(tabs[0].id, {todo:"remove"+kind, value: filename});
                if(!this.active_checkbox.checked)
                {
                    this.remove_try_button.style.display = "none";
                    this.try_button.value = "Manipulate";
                }
                 // Reload the page.
                chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
                
               
            }.bind(this))
           
        }.bind(this)
        // Go back to the main menu by clicking the back button.
        this.back_button.onclick = function() 
        {   

            this.disable_all_menus();
            this.enable_menu_of_kind("MAIN");
            // disable the backbutton.
            this.back_div.style.display = "none";
            // change the main nav buttons to be visible.
            this.main_nav_items.forEach(function(element)
            {
                element.style.display ="block";
            })
            this.new_button.style.display = "none";
          
            
        }.bind(this);

        // Create new file.
        this.new_button.onclick = function()
        {
            //open the editor.
            this.disable_all_menus();
            this.enable_menu_of_kind("NEW");
            this.filename_textfield.focus();


        }.bind(this);

        // apply the manipulation to the webpage.
        this.try_button.onclick = function()
        {
            //get the text of the current file and send it to insert.
            let current_file_name = this.editor.active_file;
            let current_text = this.editor.get_current_text();
            let position = this.position_selection.options[this.position_selection.selectedIndex].value;
            let todo = "change"+this.editor.get_current_filetype();
            let mode = this.mode_selection.options[this.mode_selection.selectedIndex].value;
            this.remove_try_button.style.display = "block";
            this.try_button.value="Update Manip.";
            show_message("Page Manipulated");
            insert(todo,current_text,position,mode,current_file_name);

        }.bind(this);
        // remove the manipulation from the webpage.
        this.remove_try_button.onclick = function(e)
        {
            // Don't remove the manipulation when the reload_on_remove_checkbox is clicked.
            var ev = e || window.event;
            if(e.target !== this.remove_try_button)
                return;
            
            this.remove_try_button.style.display = "none";
            this.try_button.value="Manipulate";
            chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
                {
                    let kind = filename_to_kind(this.editor.active_file);
                    chrome.tabs.sendMessage(tabs[0].id, {todo:"remove"+kind, value: this.editor.active_file});
                }.bind(this))
            
            this.editor.save_current_file();

            // Reload the page when the reload_on_remove_checkbox is checked.
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    if(this.nav_items[index].reload_on_remove === true)
                    {
                        this.active_checkbox.checked = false;
                        this.nav_items[index].active = false;
                        this.editor.save_current_file();
                        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
                        });
                        break;
                    }
                }
            }
            
            show_message("Removed Manipulation");
        }.bind(this)

        this.reload_on_remove_checkbox.onchange = function(){
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].reload_on_remove = this.reload_on_remove_checkbox.checked;
                    this.editor.save_current_file();
                }
            }
        }.bind(this)

        this.delete_button.onclick = function()
        {
            if(confirm("Are you sure you want to delete "+this.editor.active_file+"?"))
            {
                
                chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
                {
                    // Remove the manipulation.
                    let kind = filename_to_kind(this.editor.active_file);
                    chrome.tabs.sendMessage(tabs[0].id, {todo:"remove"+kind, value: this.editor.active_file});
                    // Removes the file-button form the array.
                    let index= this.get_nav_item_index_by_filename(this.editor.active_file);
                    this.nav_items.slice(index,1);
                    // Remove the file from the editor.
                    this.editor.delete_current_file();
                    // Make sure the reloads and the deleted file doesn't show up anymore.
                    this.disable_all_menus();
                    this.enable_menu_of_kind("MAIN");
                    show_message("File Deleted!");
                }.bind(this))
                
            }
        }.bind(this)

        this.make_button.onclick = function()
        {
            let filename = this.filename_textfield.value;
            // Check if the file already exist by trying to get the current index.
            if((this.get_nav_item_index_by_filename(filename) == null) && (this.get_nav_item_index_by_filename(filename+"."+this.current_menu.toLowerCase()) == null))
            {
                if(this.current_menu === "JS" || this.current_menu === "CSS" || this.current_menu === "HTML")
                {
                    // Add the correct file extension if there isn't one already.
                    if(!filename.endsWith("."+this.current_menu.toLowerCase()))
                    {
                        filename+='.'+this.current_menu.toLowerCase();
                    }
                    let input = this.add_nav_button(filename);
                    // Add functionallity to the button.
                    input.onclick = function()
                    {
                        this.editor.open_file(filename,"");
                        this.disable_all_menus();
                        this.enable_menu_of_kind("EDITOR");
                    }.bind(this);
                    let new_nav_item = new File(input, filename,"","","top",true,false,true,true);
                    this.nav_items.push(new_nav_item);
                    
                    this.editor.open_file(filename,"");
                    this.enabled_sites_text_area.value = "";
                    this.editor.save_current_file();
                    this.disable_all_menus();
                    this.reload_nav_items();
                    this.enable_menu_of_kind("EDITOR");
                }
            }
            else
            {
                alert("There already is a file with this name, Try a different one.");
            }
            
        }.bind(this);

        // Bind the zoom buttons.
        this.zoom_out_button.onclick = function()
        {
            if(this.current_zoom_level > 0)
            {
                this.set_zoom_factor(this.current_zoom_level-50);
            }
        }.bind(this);
        this.zoom_in_button.onclick = function()
        {
            if(this.current_zoom_level < 250)
            {
                this.set_zoom_factor(this.current_zoom_level+50);
            }
        }.bind(this);
    }
    // Changes the size of everything inside the extension when the zoom level is changed.
    set_zoom_factor(factor)
    {
        if(factor >= 0)
        {
            this.current_zoom_level = factor;
            localStorage["current_zoom_level"] = factor;
            let body_width = Math.round(600 + this.current_zoom_level*(2/3));
            let body_height = Math.round(300 + this.current_zoom_level);
            let editor_width = Math.round(420 + this.current_zoom_level*(2/3));
            let editor_height = Math.round(230 + this.current_zoom_level);
            let nav_bar_height = Math.round(250 + this.current_zoom_level);
            document.body.style["min-width"] = body_width.toString()+"px";
            document.body.style["min-height"] = body_height.toString()+"px";
            this.editor.editor_element.style["min-width"] = editor_width.toString()+"px";
            this.editor.editor_element.style["min-height"] = editor_height.toString()+"px";
            this.editor.editor.resize();
            this.navbar.style["min-height"] = nav_bar_height.toString()+"px";
            this.zoom_percentage_label.innerHTML = (this.current_zoom_level+100).toString() + " %";
        }
        // Resize the buttons of all open files to fit the size of the extension window.
        this.editor.resize_open_file_buttons();
    }

    // Creates a new button for the specified filename.
    add_nav_button(filename)
    {
        let kind = filename_to_kind(filename);
        // make the html element for the File object.
        if(kind === "JS" || kind==="CSS" || kind==="HTML")
        {
            let input = document.createElement('input');
            input.type = 'submit';
            input.value = filename;
            input.className = 'nav-button saved-'+kind.toLowerCase()+'-nav-button'
            return input;
        }
    }
    // gets the saved files from the storage.
    get_saved_nav_items()
    {
        // First get the synced storage.
        chrome.storage.sync.get(null, function(data) {
            //clear the array.
            this.nav_items = [];
            //populate the array.
            let filenames = Array.from(Object.keys(data));
            let filedatas = Array.from(Object.values(data))
            for(let i =0;i<filenames.length;i++)
            {
                let file_data = filedatas[i];
                let active_websites = file_data["active_websites"];
                let filename = file_data["filename"];
                let filetext = file_data["text"];
                let position = file_data["position"];
                let mode = file_data["mode"];
                let active = file_data["active"];
                let reload_on_remove = file_data["reload_on_remove"];
                let open = file_data["open"];
                let last = file_data["last"];
                let input = this.add_nav_button(filename);

                // Add functionallity to the button.
                input.onclick = function()
                {
                    this.editor.open_file(filename,filetext);
                    this.editor.save_current_file();
                    this.disable_all_menus();
                    this.enable_menu_of_kind("EDITOR");
                }.bind(this);
                
                let nav_item = new File(input, filename,filetext,active_websites,position,mode,active,reload_on_remove,open,last);
                this.nav_items.push(nav_item);
            }

            // Also get the local storage.
            chrome.storage.local.get(null, function(data) {

                //populate the array.
                let filenames = Array.from(Object.keys(data));
                let filedatas = Array.from(Object.values(data))
                for(let i =0;i<filenames.length;i++)
                {
                    let file_data = filedatas[i];
                    let active_websites = file_data["active_websites"];
                    let filename = file_data["filename"];
                    let filetext = file_data["text"];
                    let position = file_data["position"];
                    let mode = file_data["mode"];
                    let active = file_data["active"];
                    let reload_on_remove = file_data["reload_on_remove"];
                    let open = file_data["open"];
                    let last = file_data["last"];
                    let input = this.add_nav_button(filename);
    
                    // Add functionallity to the button.
                    input.onclick = function()
                    {
                        this.editor.open_file(filename,filetext);
                        this.editor.save_current_file();
                        this.disable_all_menus();
                        this.enable_menu_of_kind("EDITOR");
                    }.bind(this);
                   
                    let nav_item = new File(input, filename,filetext,active_websites,position,mode,active,reload_on_remove,open,last);
                    this.nav_items.push(nav_item);
                }
            }.bind(this));
        }.bind(this));
       
    }
    // Get the index of the specified filename in 'nav_items'.
    get_nav_item_index_by_filename(filename)
    {
        for(let i=0; i<this.nav_items.length;i++)
        {
            if(this.nav_items[i].filename===filename)
            {
                return i;
            }
        }
    }
    // Clears the navbar, and populates it with the new data.
    reload_nav_items()
    {
        // clear the ul's.
        let all_js_file_buttons = Array.from(document.getElementsByClassName('saved-js-nav-button'));
        let all_css_file_buttons =  Array.from(document.getElementsByClassName('saved-css-nav-button'));
        let all_html_file_buttons =  Array.from(document.getElementsByClassName('saved-html-nav-button'));
        let all_file_buttons = all_js_file_buttons.concat(all_css_file_buttons).concat(all_html_file_buttons);
        if(all_file_buttons)
        {
            all_file_buttons.forEach(function(element) 
            {
                element.parentNode.parentNode.removeChild(element.parentNode);
            })
        }
        // populate the navbar.
        this.nav_items.forEach(function(element)
        {
            let li = document.createElement('li');
            // Make the button greyed out when the file.active is set to false.
            if(element.active)
            {
                element.element.style.opacity = 1;
            }
            else
            {
                element.element.style.opacity = 0.5;
            }
            li.appendChild(element.element);
            this.navbar.appendChild(li);
        }.bind(this))
    };
    load_open_files()
    {
        let last_open_file = null;
        for(let element of this.nav_items)
        {
            if(element.open && (this.editor.files.length < this.editor.max_open_files))
            {
                this.editor.open_file(element.filename,element.text);
                this.disable_all_menus();
                this.enable_menu_of_kind("EDITOR");
                if(element.last)
                {
                    last_open_file = element.filename;
                }
            }
        }
        if(last_open_file)
        {
            this.editor.activate_file_by_name(last_open_file);
            this.disable_all_menus();
            this.enable_menu_of_kind("EDITOR");
        }
        
            
    }
    // Enables the specified menu. options: "JS","CSS","HTML","MAIN","EDITOR","NEW".
    enable_menu_of_kind(kind)
    {
        this.get_saved_nav_items();
        this.reload_nav_items();
        this.disable_all_menus();
        switch(kind)
        {
            case "JS":
            case "CSS":
            case "HTML":
                this.disable_menu_of_kind("MAIN");
                this.back_div.style.display = "block";
                let all_elements = document.getElementsByClassName('saved-'+kind.toLowerCase()+'-nav-button');
                Array.from(all_elements).forEach(function(element)
                {
                    element.style.display = "block";
                })
                this.new_button.style.display = "block";
                this.info_text.style.display = "block";
                // Change the menu tile label.
                this.menu_title_label.innerHTML = kind_to_language(kind);
                break;
            case "MAIN":
                this.menu_title_label.innerHTML = "Main Menu";
                this.main_nav_items.forEach(function(element)
                {
                    element.style.display = "block";
                })
                break;
            // This menu is shown whenever the extension is opened on a page that can't be manipulated.
            case "ERROR":
                this.editor.hide();
                this.menu_title_label.innerHTML = "";
                this.error_text.style.display = "block";
                break;
            case "EDITOR":
                this.menu_title_label.innerHTML = kind_to_language(filename_to_kind(this.editor.active_file));
                this.active_checkbox.style.display = "inline";
                this.active_label.style.display = "inline";
                this.editor_menu_items.forEach(function(element)
                {
                    element.style.display = "block";
                })
                
                chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
                {
                    chrome.tabs.sendMessage(tabs[0].id, {todo:"getStatus", value: this.editor.active_file}, function(response) {
                        if(response != null)
                        {
                            if(response.response===true)
                            {
                                this.remove_try_button.style.display = "block";
                                this.try_button.value = "Update Manip."
                            }
                        }
                        else
                        {
                            // The extension is opened on a page that it can't manipulate.
                            if(chrome.runtime.lastError) {
                                if(chrome.runtime.lastError.message === "Could not establish connection. Receiving end does not exist."){
                                    communication_test(
                                        function(){this.enable_menu_of_kind("ERROR")}.bind(this), //onFail
                                        function(){this.enable_menu_of_kind("MAIN")}.bind(this)); //onSuccess
                                    return;
                                } 
                            }
                        }
                    }.bind(this))
                }.bind(this))

                //only display the position option when html.
                if(this.editor.active_file.endsWith(".html"))
                {
                    this.position_selection.style.display = "block";
                    this.position_label.style.display = "block";
                }

                //add the active websites to the enabled_sites_text_area.
                let index = this.get_nav_item_index_by_filename(this.editor.active_file);

                this.active_checkbox.checked = this.nav_items[index].active;
                this.reload_on_remove_checkbox.checked = this.nav_items[index].reload_on_remove;
               
                this.enabled_sites_text_area.value = this.nav_items[index].active_websites;
                let positoin_options = this.position_selection.options;
                for(let i=0;i<positoin_options.length;i++)
                {
                    if(positoin_options[i].value === String(this.nav_items[index].position).toLowerCase())
                    {
                        this.position_selection.selectedIndex = i;
                        break;
                    }
                }
                let mode_options = this.mode_selection.options;
                for(let i=0;i<mode_options.length;i++)
                {
                    if(this.nav_items[index].mode != null)
                    {
                        if(mode_options[i].value === String(this.nav_items[index].mode).toLowerCase())
                        {
                            this.mode_selection.selectedIndex = i;
                            break;
                        }
                    }
                }
                
                break;
            case "NEW":
                this.menu_title_label.innerHTML = "New File";
                this.new_menu_items.forEach(function(element)
                {
                    element.style.display = "block";
                })
                break;
        }
        if(kind != "NEW")
        {
            this.current_menu = kind;
        }
        
    }

    // Disables the specified menu. options: "JS","CSS","HTML","MAIN","EDITOR","NEW".
    disable_menu_of_kind(kind)
    {
        switch(kind)
        {
            case "JS":
            case "CSS":
            case "HTML":
                this.back_div.style.display = "none";
                let all_elements = document.getElementsByClassName('saved-'+kind.toLowerCase()+'-nav-button');
                Array.from(all_elements).forEach(function(element)
                {
                    element.style.display = "none";
                })
                this.new_button.style.display = "none";
                break;
            case "MAIN":
                this.main_nav_items.forEach(function(element)
                {
                    element.style.display = "none";
                })
                break;
            case "ERROR":
                this.error_text.style.display = "none";
                this.editor.reveal();
                break;
            case "EDITOR":
                this.editor_menu_items.forEach(function(element)
                {
                    element.style.display = "none";
                })
                // These items aren't in the array because they aren't always there, so we disable them manually.
                this.active_checkbox.style.display = "none";
                this.active_label.style.display = "none";
                this.position_selection.style.display = "none";
                this.position_label.style.display = "none";
                this.remove_try_button.style.display = "none";
                this.try_button.value="Manipulate";
                break;
            case "NEW":
                this.new_menu_items.forEach(function(element)
                {
                    element.style.display = "none";
                })
                break;        
        }
    }

    // Disables all menus.
    disable_all_menus()
    {
        this.disable_menu_of_kind("MAIN");
        this.disable_menu_of_kind("JS");
        this.disable_menu_of_kind("CSS");
        this.disable_menu_of_kind("HTML");
        this.disable_menu_of_kind("EDITOR");
        this.disable_menu_of_kind("NEW");
        this.disable_menu_of_kind("ERROR");
    }
    
}

function main()
{
    let navigation = new Navigation();
}

