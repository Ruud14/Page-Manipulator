window.onload = function statup()
{
    // Enable to clear the storage.
    // chrome.storage.sync.clear();
    // chrome.storage.local.clear();
    // localStorage.clear()
    // Create the navigation.
    new Navigation();
}

// ---------------------------- General functions ----------------------------


// Inserts code into the current site.
function insert(todo, code, position, mode, filename)
// todo shoud be > changeHTML, changeCSS or changeJS
{
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
    {
        chrome.tabs.sendMessage(tabs[0].id, {todo: todo, code: code, position:position, mode:mode, filename:filename});
    });
}

// shows msg on the screen
function show_message(msg)
{
    let message_text = document.getElementById("message-text");
    message_text.textContent = msg;
    message_text.style.opacity = 1;
    window.setTimeout(function(){ message_text.style.opacity = 0;}, 1000);
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
                    setTimeout(function(){communication_test(onFail, onSuccess, retryTimeMiliSeconds)}, retryTimeMiliSeconds);
                }
                else{
                    onSuccess();
                } 
            }
            else{
                onSuccess();
            }

        });
    });
}

// ------------------------------------------------------------------------

// Class responsible for controlling the editor.
class Editor
{
    constructor(navigator)
    {
        // Array that contains [filename, editor session object] combinations.
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
                this.create_window(filename, text);
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
                let index = this.navigator.get_nav_item_index_by_filename(filename);
                this.navigator.nav_items[index].open = true;
                this.editor.setSession(element[1]);
                this.editor_element.style.display = "block";
                // Focus on the textarea after opening a file.
                document.getElementsByClassName("ace_text-input")[0].focus();
                break;
            }
        }
        // Make the button that corresponds with the current file active.
        this.make_button_active(filename);
    }

    // Make the active window button look darker to make it the obvious open file.
    make_button_active(filename)
    {
        let all_html_elements = document.getElementsByClassName("file-title-button");
        let all_close_html_elements = document.getElementsByClassName("close-button");
        Array.from(all_html_elements).forEach(function(element)
        {
            // Highlight the right button.
            if(element.value === filename)
            {
                element.style.opacity = 1;
                all_close_html_elements[Array.from(all_html_elements).indexOf(element)].style.opacity = 1;
            }
            // Make the other html_elements greyed out.
            else
            {
                element.style.opacity = 0.5;
                all_close_html_elements[Array.from(all_html_elements).indexOf(element)].style.opacity = 0.5;
            }
        });
        // Resize all open file html_elements to fit the window.
        this.resize_open_file_html_elements();
        
    }

    // Changes the width of the open file buttons to fit the extension window.
    resize_open_file_html_elements()
    {
        let all_html_elements = document.getElementsByClassName("file-title-button");
        let editor_width_str = this.editor_element.style["min-width"];
        let button_width = Math.round((parseInt(editor_width_str.substring(0, editor_width_str.length - 2)) - 20)/all_html_elements.length);
        // Also take the with of the close html_elements into a count.
        button_width = button_width - 3*all_html_elements.length;
        Array.from(all_html_elements).forEach(function(element)
        {
            element.style.width = button_width + "px";
        });
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
        });
        //Delete the file html_elements.
        Array.from(all_open_files).forEach(function(element){
            element.parentNode.removeChild(element);
        });
        // Clear the files list.
        this.files = [];
    }

    // Closes the editor of the file with the specified filename.
    close_file(filename)
    {
        let all_open_files = document.getElementsByClassName("open-files-list-item");
        // Set the file to being closed
        let index = this.navigator.get_nav_item_index_by_filename(filename);
        this.navigator.nav_items[index].open = false;
        
        this.save_file_by_name(filename);
        // Delete the file button.
        for(const element of Array.from(all_open_files))
        {
            if(element.childNodes[0].value === filename)
            {
                element.parentNode.removeChild(element);
                break;
            }
        }
        
        // Remove the file from this.files.
        for(let i = 0; i<this.files.length; i++)
        {
            if(this.files[i][0] === filename)
            {
                this.files.splice(i, 1);
                break;
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
            // Open an other file thats open.
            this.activate_file_by_name(this.files[0][0]);
            this.navigator.disable_all_menus();
            this.navigator.enable_menu_of_kind("EDITOR");
        }
    }

    // Creates a file button for a file with the specified name.
    create_file_button(filename)
    {   
        let ul = document.getElementById("open-files-list");
        let li = document.createElement("li");
        let file_button = document.createElement("input");
        let close_button = document.createElement("a");
        li.className = "open-files-list-item";
        close_button.innerText = "x";
        close_button.className = "close-button"
        close_button.onclick = function()
        {
            this.close_file(filename);
        }.bind(this);
        file_button.type ="submit";
        file_button.className ="file-title-button";
        file_button.value =filename;
        file_button.onclick = function()
        {
            // First save the old file.
            this.save_current_file();
            this.activate_file_by_name(filename);
            this.navigator.enable_menu_of_kind("EDITOR");
            // Save the new file.
            this.save_current_file();
        }.bind(this);
        li.appendChild(file_button);
        li.appendChild(close_button);
        ul.appendChild(li);
        this.make_button_active(filename);
        return li;
    }

    // Creates an editor window for the file with the specified name and text.
    create_window(filename, text)
    {
        let new_session = new this.EditSession(text);

        // Disable the info text on the left of the editor if it is an HTML file.
        if(filename_to_kind(filename) === "HTML")
        {
            new_session.setUseWorker(false);
        }
        // Set the editor to the correct language.
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

        // Bind the save_current_file function to changes in the editor.
        new_session.on("change", function(delta) {
            this.save_current_file();
            if(this.navigator.current_menu != "EDITOR")
            {
                this.navigator.enable_menu_of_kind("EDITOR");
            }
        }.bind(this));
        this.files.push([filename, new_session]);
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
        chrome.storage.sync.remove(filename, function(){});
        chrome.storage.local.remove(filename, function(){});
    }

    // Change the filename of the currently active file.
    change_current_file_name(new_filename)
    {
        let old_filename = this.active_file;
        // Change the filename in the editor.
        for(const [i, file] of this.files.entries())
        {
            if(file[0] === old_filename)
            {
                this.files[i][0] = new_filename;
                this.active_file = new_filename;
                break;
            }
        }
        // Change the filename in the navigator.
        for(let i = 0; i<this.navigator.nav_items.length; i++)
        {
            if(this.navigator.nav_items[i].filename === old_filename)
            {
                this.navigator.nav_items[i].filename = new_filename;
                break;
            }
        }
        
        let all_html_elements = document.getElementsByClassName("file-title-button");

        // Put the new filebutton in the position of the old one and remove the old one.
        for(const element of Array.from(all_html_elements))
        {
            if(element.value === old_filename)
            {
                // Create new filebutton.
                let new_file_button = this.create_file_button(new_filename);
                element.parentNode.parentNode.insertBefore(new_file_button, element.parentNode);
                element.parentNode.parentNode.removeChild(element.parentNode);
                break;
            }
        }

        // Save the file in storage with a new name.
        this.save_file_by_name(new_filename);
        // Remove the old file from storage.
        chrome.storage.sync.remove(old_filename, function(){});
        chrome.storage.local.remove(old_filename, function(){});

        this.resize_open_file_html_elements();
    }

    // Save a file to storage using its name.
    save_file_by_name(filename)
    {
        let all_new_data = {};
        let current_file_data = {};
        current_file_data.filename = filename;

        for(let element of this.files)
        {
            if(element[0] === filename)
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
            chrome.storage.sync.remove(filename, function(){});
            chrome.storage.local.set(all_new_data, function() {
                show_message("Saved!");
            });
        }
        else
        {
            chrome.storage.local.remove(filename, function(){});
            chrome.storage.sync.set(all_new_data, function() {
                show_message("Saved!");
            });
        }
    }

    // Saves the current file and it's properties to storage.
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
            chrome.storage.sync.remove(current_file_name, function(){});
            chrome.storage.local.set(all_new_data, function() {
                show_message("Saved!");
            });
        }
        else
        {
            chrome.storage.local.remove(current_file_name, function(){});
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

    // Whenever a different file is selected, the newly selected file should become the 'open' file.
    // This method set the new file to the last opened file so that this file will be opened at restart.
    update_last_open_file()
    {
        // Save all open files because '.last' can only be true on one, so the rest needs to be set to false. 
        for(let element of this.files)
        {
            this.save_file_by_name(element[0]);
        }
    }
}

// Object that represents a saved file.
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
        this.kind = filename_to_kind(filename); // Determines the filetype.
    }
}

// Controlls the navigation through the menus.
class Navigation
{
    constructor()
    {
        // Get all the html elements.
        // General elements.
        this.navbar = document.getElementById("navbar");
        this.back_div = document.getElementById("back-div");

        // html_elements
        this.back_button = document.getElementById("back-button");
        this.reload_button = document.getElementById("reload-button");
        this.new_button = document.getElementById("new-button");
        this.js_button = document.getElementById("JS-button");
        this.css_button = document.getElementById("CSS-button");
        this.html_button = document.getElementById("HTML-button");
        this.info_button = document.getElementById("info-button");
        this.bug_report_button = document.getElementById("bug-report-button");
        this.donate_button = document.getElementById("donate-button");
        this.try_button = document.getElementById("try-button");
        this.remove_try_button = document.getElementById("remove-try-button");
        this.make_button = document.getElementById("make-button");
        this.delete_button = document.getElementById("delete-button");
    
        // Dropdowns
        this.position_selection = document.getElementById("position-selection");
        this.mode_selection = document.getElementById("mode-selection");

        // Textfields
        this.filename_textfield = document.getElementById("filename-textfield");
        this.enabled_sites_text_area = document.getElementById("enabled-sites-text-area");
        
        // Checkboxes
        this.active_checkbox = document.getElementById("active-checkbox");
        this.reload_on_remove_checkbox = document.getElementById("reload-on-remove-checkbox");

        // Texts
        this.info_text = document.getElementById("info-text");
        this.error_text = document.getElementById("error-text");

        // Labels
        this.active_label = document.getElementById("active-label");
        this.active_websites_label = document.getElementById("active-websites-label");
        this.matching_pages_label = document.getElementById("matching-pages-label");
        this.position_label = document.getElementById("position-label");
        this.filename_input_label = document.getElementById("filename-input-label");
        this.language_selection_label = document.getElementById("language-selection-label");
        this.menu_title_label = document.getElementById("menu-title-label");
        this.extra_info_label = document.getElementById("extra-info-label");
        this.project_support_label = document.getElementById("project-support-label");

        // Filename editing items before editing.
        this.filename_label = document.getElementById("filename-label");
        this.change_filename_not_editing_div = document.getElementById("change-filename-not-editing-div");
        this.change_filename_label = document.getElementById("change-filename-label");
        this.change_filename_button = document.getElementById("change-filename-button");

        // Filename editing items while editing.
        this.change_filename_editing_div = document.getElementById("change-filename-editing-div");
        this.change_filename_textfield = document.getElementById("change-filename-textfield");
        this.change_filename_button_div = document.getElementById("change-filename-button-div");
        this.cancel_filename_change_button = document.getElementById("cancel-filename-change-button");
        this.save_filename_change_button = document.getElementById("save-filename-change-button");

        // Zoom factor elements.
        this.zoom_out_button = document.getElementById("zoom-out-button");
        this.zoom_percentage_label = document.getElementById("zoom-percentage-label");
        this.zoom_in_button = document.getElementById("zoom-in-button");

        // Dividers
        this.menu_title_divider = document.getElementById("menu-title-divider");
        this.main_menu_division_lines = document.getElementsByClassName("main-menu-division-line");
        this.editor_menu_division_lines = document.getElementsByClassName("editor-menu-division-line");

        // The navigation creates the editor.
        this.editor = new Editor(this);
        this.current_menu = "MAIN";

        this.current_zoom_level = 0;
        // Use the saved zoom level at startup if there is one.
        if(localStorage["current_zoom_level"])
        {
            this.set_zoom_factor(parseInt(localStorage["current_zoom_level"]));
        }
        // Use default zoom level of 300% instead.
        else
        {
            this.set_zoom_factor(200);
        }

        // Arrays that contain the items that are always present on that menu.
        this.main_nav_items = [
            this.js_button, this.css_button, this.html_button, 
            this.info_text, this.info_button, this.bug_report_button, 
            this.language_selection_label, this.donate_button, this.extra_info_label, 
            this.project_support_label].concat(Array.from(this.main_menu_division_lines));

        this.editor_menu_items = [
            this.back_div, this.try_button, this.active_websites_label,
            this.enabled_sites_text_area, this.matching_pages_label, this.mode_selection,
            this.delete_button, this.filename_label, this.change_filename_not_editing_div, 
            this.change_filename_editing_div].concat(Array.from(this.editor_menu_division_lines));

        this.new_menu_items = [
            this.make_button, this.filename_textfield, this.back_div,
            this.filename_input_label, this.info_text]; 

        // Array that contains all files present in the Navigator.
        // All elements should be of type 'File'.
        this.nav_items = [];

        // Bind the right function to every html element.
        this.bind_html_elements();

        // Test if communication with the backend is possible.
        // Enable the 'ERROR' menu if this isn't the case.
        communication_test(
            function(){this.enable_menu_of_kind("ERROR");}.bind(this), //onFail
            function()
            {
                this.enable_menu_of_kind("MAIN");
                this.load_open_files();
            }.bind(this)); //onSuccess
        setTimeout(function() {this.load_open_files();}.bind(this), 100);
    }
    
    // binds the correct functions to the html_elements.
    // This method should only be run once from inside of the constructor.
    bind_html_elements()
    {
        // Bind the button that changes the name of the current file.
        this.change_filename_button.onclick = function()
        {
            this.change_filename_not_editing_div.style.display = "none";
            this.change_filename_editing_div.style.display = "block";
            this.change_filename_textfield.focus();

        }.bind(this)

        // Bind the button that cancels editing the filename.
        this.cancel_filename_change_button.onclick = function()
        {
            this.change_filename_not_editing_div.style.display = "block";
            this.change_filename_editing_div.style.display = "none";
        }.bind(this)

        // Bind the button that saves the new filename.
        this.save_filename_change_button.onclick = function()
        {
            let new_filename = this.change_filename_textfield.value;
            let split_parts = this.editor.active_file.split(".");
            let file_extension = split_parts[split_parts.length - 1];

            // Check if a file with the new filename already exists.
            if(this.file_exists(new_filename))
            {
                alert("There already is a file with this name, Try a different one.");
            }
            else
            {
                // Add the correct file extension if there isn't one already.
                if(!new_filename.endsWith("." + file_extension))
                {
                    new_filename += '.' + file_extension;
                }
                // Change the filename of the current file.
                this.editor.change_current_file_name(new_filename);
                this.enable_menu_of_kind("EDITOR");
            }
        }.bind(this)

        // Bind the info button on the main menu.
        this.info_button.onclick = function()
        {   
            window.open("https://github.com/Ruud14/Page-Manipulator", "_blank").focus();
        }.bind(this);

        // Bind the bug report button on the main menu.
        this.bug_report_button.onclick = function()
        {   
            window.open("https://github.com/Ruud14/Page-Manipulator/issues", "_blank").focus();
        }.bind(this);

        // Bind the 'active' checkbox.
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
                    break;
                }
            }
        }.bind(this);

        // Function for autosaving when changing the position of the injected code. (HTML only)
        let position_change_function = function()
        {
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].position = this.position_selection.options[this.position_selection.selectedIndex].value;
                    this.editor.save_current_file();
                    break;
                }
            }
        }.bind(this);

        // Autosave when changing the position of the injected code. (HTML only)
        this.position_selection.onkeyup = position_change_function;
        this.position_selection.onchange = position_change_function;

        // Function for autosaving when changing the mode. (Exact or Recursive)
        let mode_change_function = function()
        {
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].mode = this.mode_selection.options[this.mode_selection.selectedIndex].value;
                    this.editor.save_current_file();
                    break;
                }
            }
        }.bind(this);

        // Autosave when changing the mode.
        this.mode_selection.onkeyup = mode_change_function;
        this.mode_selection.onchange = mode_change_function;

        // Function for autosaving when changing the 'active sites' textarea.
        let active_sites_textarea_change_function = function()
        {
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].active_websites = this.enabled_sites_text_area.value;
                    this.editor.save_current_file();
                    break;
                }
            }
        }.bind(this);

        // Function for autosaving when leaving the 'active sites' textarea.
        let active_sites_textarea_leave_function = function()
        {
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].active_websites = this.enabled_sites_text_area.value;
                    if(this.enabled_sites_text_area.value.replaceAll(/\s/g, "") === "" && this.active_checkbox.checked === true)
                    {
                        this.nav_items[index].active = false;
                        this.active_checkbox.checked = false;
                    }
                    this.editor.save_current_file();
                    break;
                }
            }
        }.bind(this)

        // Autosave when changing the 'active sites' textarea.
        this.enabled_sites_text_area.onkeyup = active_sites_textarea_change_function;
        this.enabled_sites_text_area.onchange = active_sites_textarea_leave_function;

        // Bind that button that navigates to the JavaScript page.
        this.js_button.onclick = function()
        {   
            this.enable_menu_of_kind("JS");
        }.bind(this);

        // Bind that button that navigates to the CSS page.
        this.css_button.onclick = function()
        {   
            this.enable_menu_of_kind("CSS");
        }.bind(this);

        // Bind that button that navigates to the HTML page.
        this.html_button.onclick = function()
        {   
            this.enable_menu_of_kind("HTML");
        }.bind(this);

        // Bind the button that reloads the page.
        this.reload_button.onclick = function()
        {
            let filename = this.editor.active_file;
            chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
            {
                this.editor.save_current_file();
                let kind = filename_to_kind(filename);
                // Remove the manipulation first.
                chrome.tabs.sendMessage(tabs[0].id, {todo:"remove" + kind, value: filename});
                if(!this.active_checkbox.checked)
                {
                    this.remove_try_button.style.display = "none";
                    this.try_button.value = "Manipulate";
                }
                 // Reload the page.
                chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
            }.bind(this));
        }.bind(this);

        // Bind the back button.
        this.back_button.onclick = function() 
        {   
            this.disable_all_menus();
            this.enable_menu_of_kind("MAIN");
        }.bind(this);

        // Bind the button that creates a new file.
        this.new_button.onclick = function()
        {
            //open the editor.
            this.disable_all_menus();
            this.enable_menu_of_kind("NEW");
            this.filename_textfield.focus();
        }.bind(this);

        // Bind the 'manipulate'/'update manipulation' button.
        this.try_button.onclick = function()
        {
            //get the text of the current file and send it to insert.
            let current_file_name = this.editor.active_file;
            let current_text = this.editor.get_current_text();
            let position = this.position_selection.options[this.position_selection.selectedIndex].value;
            let todo = "change" + this.editor.get_current_filetype();
            let mode = this.mode_selection.options[this.mode_selection.selectedIndex].value;
            this.remove_try_button.style.display = "block";
            this.try_button.value = "Update Manip.";
            show_message("Page Manipulated");
            insert(todo, current_text, position, mode, current_file_name);

        }.bind(this);

        // Bind the button that removes the manipulation from the web-page.
        this.remove_try_button.onclick = function(e)
        {
            // Don't remove the manipulation when the reload_on_remove_checkbox is clicked.
            if(e.target !== this.remove_try_button)
                return;
            
            // Change the buttons.
            this.remove_try_button.style.display = "none";
            this.try_button.value ="Manipulate";

            // Send remove message to backend.
            chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
            {
                let kind = filename_to_kind(this.editor.active_file);
                chrome.tabs.sendMessage(tabs[0].id, {todo:"remove" + kind, value: this.editor.active_file});
            }.bind(this));
            
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
                    break;
                }
            }
            
            show_message("Removed Manipulation");
        }.bind(this);

        // Bind the checkbox that determines if the page should be reloaded after removing a manipulation.
        this.reload_on_remove_checkbox.onchange = function(){
            for(let element of this.nav_items)
            {
                if(element.filename === this.editor.active_file)
                {
                    let index = this.nav_items.indexOf(element);
                    this.nav_items[index].reload_on_remove = this.reload_on_remove_checkbox.checked;
                    this.editor.save_current_file();
                    break;
                }
            }
        }.bind(this);

        // Bind the button that removes the current file from storage.
        this.delete_button.onclick = function()
        {
            // Make sure the user didn't press 'delete' by accident.
            if(confirm("Are you sure you want to delete " + this.editor.active_file + "?"))
            {
                chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
                {
                    // Remove the manipulation.
                    let kind = filename_to_kind(this.editor.active_file);
                    chrome.tabs.sendMessage(tabs[0].id, {todo:"remove" + kind, value: this.editor.active_file});
                    
                    let index = this.get_nav_item_index_by_filename(this.editor.active_file);
                    // Remove the file from the editor.
                    this.editor.delete_current_file();
                    // Removes the file form the nav_items array.
                    if(this.nav_items.length === 1)
                    {
                        this.nav_items = [];
                    }
                    else{
                        this.nav_items.slice(index, 1);
                    }
                    // Enable the right menu after deleting.
                    if(this.editor.files.length >= 1)
                    {
                        this.enable_menu_of_kind("EDITOR");
                    }
                    else
                    {
                        this.enable_menu_of_kind("MAIN");
                    }
                    show_message("File Deleted!");
                }.bind(this));
            }
        }.bind(this);

        // Bind the button that confirms the creation of a new file.
        this.make_button.onclick = function()
        {
            let filename = this.filename_textfield.value;
            // Make sure there isn't already a file with the same name.
            if(this.file_exists(filename))
            {
                alert("There already is a file with this name, Try a different one.");
            }
            else
            {
                if(this.current_menu === "JS" || this.current_menu === "CSS" || this.current_menu === "HTML")
                {
                    // Add the correct file extension if there isn't one already.
                    if(!filename.endsWith("." + this.current_menu.toLowerCase()))
                    {
                        filename += '.' + this.current_menu.toLowerCase();
                    }
                    // Create a navigation button for the new file.
                    let input = this.add_nav_button(filename);
                    // Add functionallity to the button.
                    input.onclick = function()
                    {
                        this.editor.open_file(filename, "");
                        this.enable_menu_of_kind("EDITOR");
                    }.bind(this);
                    let new_nav_item = new File(input, filename, "", "", "top", true, false, true, true);
                    this.nav_items.push(new_nav_item);
                    
                    this.editor.open_file(filename, "");
                    this.enabled_sites_text_area.value = "";
                    this.editor.save_current_file();
                    this.enable_menu_of_kind("EDITOR");
                }
            }
        }.bind(this);

        // Bind the button that makes the extension window smaller.
        this.zoom_out_button.onclick = function()
        {
            if(this.current_zoom_level > 0)
            {
                this.set_zoom_factor(this.current_zoom_level - 50);
            }
        }.bind(this);

        // Bind the button that makes the extension window bigger.
        this.zoom_in_button.onclick = function()
        {
            if(this.current_zoom_level < 250)
            {
                this.set_zoom_factor(this.current_zoom_level + 50);
            }
        }.bind(this);
    }

    // Check if a a file with the specified filename exists.
    file_exists(filename)
    {
        let file_extension = "." + this.current_menu.toLowerCase();
        // Check if the filename already contains the right file extension.
        if(filename.endsWith(file_extension))
        {
            // Check if there alreay is a file with the same name.
            if(this.get_nav_item_index_by_filename(filename) == null)
            {
                return false;
            }
            else
            {
                return true;
            }
        }
        else
        {
            // Check if there alreay is a file with the same name.
            if(this.get_nav_item_index_by_filename(filename + file_extension) == null)
            {
                return false;
            }
            else
            {
                return true;
            }
        }
    }

    // Changes the size of everything inside the extension when the zoom level is changed.
    // The factor is the percentage-100 so 300% would be factor 200. 
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
            document.body.style["min-width"] = body_width.toString() + "px";
            document.body.style["min-height"] = body_height.toString() + "px";
            this.editor.editor_element.style["min-width"] = editor_width.toString() + "px";
            this.editor.editor_element.style["min-height"] = editor_height.toString() + "px";
            this.editor.editor.resize();
            this.navbar.style["min-height"] = nav_bar_height.toString() + "px";
            this.zoom_percentage_label.innerText = (this.current_zoom_level+100).toString() + " %";
        }
        // Resize the html_elements of all open files to fit the size of the extension window.
        this.editor.resize_open_file_html_elements();
    }

    // Creates a new navigation button for the specified filename.
    add_nav_button(filename)
    {
        let kind = filename_to_kind(filename);
        // make the html element for the File object.
        if(kind === "JS" || kind === "CSS" || kind === "HTML")
        {
            let input = document.createElement("input");
            input.type = "submit";
            input.value = filename;
            input.className = "nav-button saved-" + kind.toLowerCase() + "-nav-button";
            return input;
        }
    }

    // Gets the saved files from storage.
    get_saved_nav_items()
    {
        // First get the synced storage.
        chrome.storage.sync.get(null, function(data) {
            // Clear the array.
            this.nav_items = [];
            // Populate nav_items.
            let filenames = Array.from(Object.keys(data));
            let filedatas = Array.from(Object.values(data));
            for(let i = 0; i<filenames.length; i++)
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

                // Add functionallity to the navigation button.
                input.onclick = function()
                {
                    this.editor.open_file(filename, filetext);
                    this.editor.save_current_file();
                    this.disable_all_menus();
                    this.enable_menu_of_kind("EDITOR");
                }.bind(this);
                
                let nav_item = new File(input, filename, filetext, active_websites, position, mode, active, reload_on_remove, open, last);
                this.nav_items.push(nav_item);
            }

            // Also get the local storage.
            chrome.storage.local.get(null, function(data) {

                // Populate nav_items
                let filenames = Array.from(Object.keys(data));
                let filedatas = Array.from(Object.values(data));
                for(let i = 0; i<filenames.length; i++)
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
    
                    // Add functionallity to the navigation button.
                    input.onclick = function()
                    {
                        this.editor.open_file(filename, filetext);
                        this.editor.save_current_file();
                        this.disable_all_menus();
                        this.enable_menu_of_kind("EDITOR");
                    }.bind(this);
                   
                    let nav_item = new File(input, filename, filetext, active_websites, position, mode, active, reload_on_remove, open, last);
                    this.nav_items.push(nav_item);
                }
            }.bind(this));
        }.bind(this));
       
    }

    // Get the index of a file in 'this.nav_items'.
    get_nav_item_index_by_filename(filename)
    {
        for(let i=0; i<this.nav_items.length; i++)
        {
            if(this.nav_items[i].filename === filename)
            {
                return i;
            }
        }
    }

    // Clears the navbar, and populates it again.
    // This way the opacity of the file buttons is set to the right value.
    reload_nav_buttons()
    {
        // Clear the ul's.
        let all_js_file_html_elements = Array.from(document.getElementsByClassName("saved-js-nav-button"));
        let all_css_file_html_elements =  Array.from(document.getElementsByClassName("saved-css-nav-button"));
        let all_html_file_html_elements =  Array.from(document.getElementsByClassName("saved-html-nav-button"));
        let all_file_html_elements = all_js_file_html_elements.concat(all_css_file_html_elements).concat(all_html_file_html_elements);
        if(all_file_html_elements)
        {
            all_file_html_elements.forEach(function(element) 
            {
                element.parentNode.parentNode.removeChild(element.parentNode);
            })
        }

        // Populate the navbar again.
        this.nav_items.forEach(function(element)
        {
            let li = document.createElement("li");
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

    // This method opens the files at startup.
    load_open_files()
    {
        let last_open_file = null;
        for(let element of this.nav_items)
        {
            // Open all files that were open before.
            if(element.open && (this.editor.files.length < this.editor.max_open_files))
            {
                this.editor.open_file(element.filename, element.text);
                this.enable_menu_of_kind("EDITOR");
                if(element.last)
                {
                    last_open_file = element.filename;
                }
            }
        }
        // Open the file that was up front last time, and put it up front again.
        if(last_open_file)
        {
            this.editor.activate_file_by_name(last_open_file);
            this.enable_menu_of_kind("EDITOR");
        }   
    }

    // Enables the specified menu. 
    // options: "JS", "CSS", "HTML", "MAIN", "ERROR", "EDITOR", "NEW".
    enable_menu_of_kind(kind)
    {
        // Get all files from storage.
        this.get_saved_nav_items();
        // Reload the navigation buttons based on the new data from storage.
        this.reload_nav_buttons();
        // Dissable all menus.
        this.disable_all_menus();
        // Activate the right menu.
        switch(kind)
        {
            case "JS":
            case "CSS":
            case "HTML":
                this.back_div.style.display = "block";
                let all_elements = document.getElementsByClassName("saved-" + kind.toLowerCase() + "-nav-button");
                Array.from(all_elements).forEach(function(element)
                {
                    element.style.display = "block";
                });
                this.new_button.style.display = "block";
                this.info_text.style.display = "block";
                // Change the menu tile label.
                this.menu_title_label.innerText = kind_to_language(kind);
                break;
            case "MAIN":
                this.menu_title_label.innerText = "Main Menu";
                this.main_nav_items.forEach(function(element)
                {
                    element.style.display = "block";
                });
                break;
            // This menu is shown whenever the extension is opened on a page that can't be manipulated.
            case "ERROR":
                this.editor.hide();
                this.menu_title_label.innerText = "";
                this.error_text.style.display = "block";
                this.menu_title_divider.style.display = "none";
                break;
            case "EDITOR":
                // Show the name of the language in the navigation bar.
                this.menu_title_label.innerText = kind_to_language(filename_to_kind(this.editor.active_file));
                this.active_checkbox.style.display = "inline";
                this.active_label.style.display = "inline-block";
                this.editor_menu_items.forEach(function(element)
                {
                    element.style.display = "block";
                });
                // Set the state of the filename editing to not editing.
                this.change_filename_editing_div.style.display = "none";
                this.change_filename_not_editing_div.style.display = "block";
                this.change_filename_label.innerText = this.editor.active_file;
                this.change_filename_textfield.value = this.editor.active_file;
                
                chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
                {
                    // Check if the current page has been manipulated.
                    chrome.tabs.sendMessage(tabs[0].id, {todo:"getStatus", value: this.editor.active_file}, function(response) {
                        if(response != null)
                        {
                            // If the current page has been manipulated, change the 'manipulate' button to 'Update manip.'
                            if(response.response === true)
                            {
                                this.remove_try_button.style.display = "block";
                                this.try_button.value = "Update Manip.";
                            }
                        }
                        else
                        {
                            // The extension is opened on a page that it can't manipulate.
                            if(chrome.runtime.lastError) {
                                if(chrome.runtime.lastError.message === "Could not establish connection. Receiving end does not exist."){
                                    communication_test(
                                        function(){this.enable_menu_of_kind("ERROR");}.bind(this), //onFail
                                        function(){
                                            this.enable_menu_of_kind("MAIN");
                                            this.load_open_files();
                                        }.bind(this)); //onSuccess
                                    return;
                                } 
                            }
                        }
                    }.bind(this));
                }.bind(this));

                // Only display the position option when html.
                if(this.editor.active_file.endsWith(".html"))
                {
                    this.position_selection.style.display = "block";
                    this.position_label.style.display = "block";
                }

                // Add the active websites to the enabled_sites_text_area.
                let index = this.get_nav_item_index_by_filename(this.editor.active_file);
                // Change the settings to the correct settings for the current file.
                this.active_checkbox.checked = this.nav_items[index].active;
                this.reload_on_remove_checkbox.checked = this.nav_items[index].reload_on_remove;
                this.enabled_sites_text_area.value = this.nav_items[index].active_websites;
                let positoin_options = this.position_selection.options;
                for(let i = 0; i<positoin_options.length; i++)
                {
                    if(positoin_options[i].value === String(this.nav_items[index].position).toLowerCase())
                    {
                        this.position_selection.selectedIndex = i;
                        break;
                    }
                }
                let mode_options = this.mode_selection.options;
                for(let i = 0; i<mode_options.length; i++)
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
                this.menu_title_label.innerText = "New File";
                this.new_menu_items.forEach(function(element)
                {
                    element.style.display = "block";
                })
                break;
        }
        // Only change the current menu whenever the current menu isn't the new file menu.
        if(kind != "NEW")
        {
            this.current_menu = kind;
        }
    }

    // Disables the specified menu. 
    // options: "JS", "CSS", "HTML", "MAIN", "ERROR", "EDITOR", "NEW".
    disable_menu_of_kind(kind)
    {
        switch(kind)
        {
            case "JS":
            case "CSS":
            case "HTML":
                this.back_div.style.display = "none";
                let all_elements = document.getElementsByClassName("saved-" + kind.toLowerCase() + "-nav-button");
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
                this.menu_title_divider.style.display = "block";
                break;
            case "EDITOR":
                this.editor_menu_items.forEach(function(element)
                {
                    element.style.display = "none";
                })
                // These items aren't in the 'editor_menu_items' array because they aren't always there, 
                // so they must be dissabled manually
                this.active_checkbox.style.display = "none";
                this.active_label.style.display = "none";
                this.position_selection.style.display = "none";
                this.position_label.style.display = "none";
                this.remove_try_button.style.display = "none";
                this.try_button.value = "Manipulate";
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
