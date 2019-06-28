window.onload = function statup()
{
    // Enable to clear the storage.
    //chrome.storage.sync.clear();
    main()
}
// Inserts code into the current site.
function insert(todo,code,position,mode,title)
// todo shoud be > changeHTML, changeCSS or changeJS
{
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
    {
        chrome.tabs.sendMessage(tabs[0].id, {todo: todo, code: code, position:position,mode:mode,title:title});
    })
    
}
// shows msg on the screen
function show_message(msg)
{
    let message_text = document.getElementById("message-text");
    message_text.textContent = msg;
    message_text.style.display = "block";
    window.setTimeout(function(){ message_text.style.display = "none";},1000);
}
// Returns the filetype of the specified filename in the "FILEEXTENSION" format.
function filename_to_kind(filename)
{
    return (filename.substring(filename.lastIndexOf(".") + 1, filename.length)).toUpperCase();
}
// controlls the edit window
class Editor
{
    constructor(navigator)
    {
        this.files = [];
        this.max_open_files = 6;
        this.active_file = "none";
        this.navigator = navigator;
    }
    
    // Opens a new editor window if the file doesn't exist yet. 
    // and opens the file if it aleady exists.
    open_file(title, text)
    {
        if(this.files.length < this.max_open_files)
        {
            // check if the file isn't already open.
            if(this.files.includes(title))
            {
                this.activate_file_by_name(title);
            }
            else
            {
                this.create_window(title,text);
                this.create_file_button(title);
                this.activate_file_by_name(title);
            }
        }
        else
            alert("Close some files first.")
    }
    // Opens the editor window of the file with the specified filename.
    activate_file_by_name(title)
    {
        this.active_file = title;
        let all_textfields = document.getElementsByClassName("textfield");
            Array.from(all_textfields).forEach(function(element)
            {
                // Enable the right text area.
                if(element.id === "textfield-"+title)
                {
                    element.style.display = 'block';
                    element.focus();
                }
                // Disable all other textareas
                else 
                    element.style.display = 'none';
            })
        
    }
    // Make the active window button look darker to make it the obvious open file.
    make_button_active(title)
    {
        let all_buttons = document.getElementsByClassName("file-title-button");
        Array.from(all_buttons).forEach(function(element)
        {
            // make the button active
            if(element.value===title)
                element.style.backgroundColor="#222222";
            // make the other buttons inactive.
            else
                element.style.backgroundColor="#444444";
        })
        
    }
    // Closes the editor of the file with the specified filename.
    close_file(title)
    {
        let all_open_files = document.getElementsByClassName("open-files-list-item");
        let all_textfields = document.getElementsByClassName("textfield");

        //Delete the file button.
        Array.from(all_open_files).forEach(function(element)
        {
            if(element.childNodes[0].value === title)
            {
                element.parentNode.removeChild(element);
            }
        })
        
        //Delete the textarea.
        Array.from(all_textfields).forEach(function(element)
        {
            if(element.id === "textfield-"+title)
            {
                element.parentNode.removeChild(element);
            }
        })
        // Remove the file from this.files.
        for(let i=0; i<this.files.length;i++)
        {
            if(this.files[i] === title)
            {
                this.files.splice(i,1);
            }
        }

        // If you close the last open file, the editmenu will go away and be replaced with the main menu.
        if(this.files.length == 0)
        {
            
            this.navigator.disable_all_menus();
            this.navigator.enable_menu_of_kind("MAIN");
        }
    }
    // Creates a navigation menu for a file with the specified name.
    create_file_button(title)
    {   
        let ul = document.getElementById("open-files-list");
        let li = document.createElement("li");
        let file_button = document.createElement("input");
        let close_button = document.createElement("a");
        li.className = "open-files-list-item";
        close_button.innerHTML = "x";
        close_button.className = "close-button"
        self=this;
        close_button.onclick = function()
        {
            this.close_file(title);
        }.bind(this);
        file_button.type="submit";
        file_button.className="file-title-button";
        file_button.value=title;
        file_button.onclick = function()
        {
            this.activate_file_by_name(title);
            this.make_button_active(title);
            this.navigator.disable_all_menus();
            this.navigator.enable_menu_of_kind("EDITOR");
        }.bind(this);
        li.appendChild(file_button);
        li.appendChild(close_button);
        ul.appendChild(li);
        this.make_button_active(title);
        this.files.push(title);
    }
    // Creates a editor window for the file with the specified name and text.
    create_window(title,text)
    {
        let write_area = document.getElementById("write-area");
        let textfield = document.createElement('textarea');
        let textnode = document.createTextNode(text);
        textfield.className = "textfield";
        textfield.id = "textfield-"+title;
        textfield.placeholder = "Code here";
        textfield.appendChild(textnode);
        textfield.onkeyup = function(){ this.save_current_file();}.bind(this);
        textfield.onchange = function(){ this.save_current_file();}.bind(this);
        write_area.appendChild(textfield);
    }
    // Returns the text of the current edit menu.
    get_current_text()
    {
        let current_textfield = document.getElementById("textfield-"+this.active_file);
        return current_textfield.value;
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
        this.close_file(this.active_file);
        chrome.storage.sync.remove(this.active_file,function(){});
        for(let i=0; i<this.files.length;i++)
        {
            if(this.files[i] === this.active_file)
            {
                this.files.splice(i,1);
                break;
            }
        }
    }
    // Saves the current file and it's properties to the storage.
    save_current_file()
    {
        let current_file_name = this.active_file;
        let current_text = this.get_current_text();
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
        current_file_data.active = this.navigator.active_checkbox.checked;
        all_new_data[current_file_name] = current_file_data;

        chrome.storage.sync.set(all_new_data, function() {
            show_message("Saved!");
        });
    }
}

// 
class File
{
    constructor(input, filename, text, active_websites, position,mode,active)
    {
        this.title = filename;
        this.text = text;
        this.navigator = navigator;
        this.active_websites = active_websites
        this.position = position;
        this.mode= mode;
        this.element = input;
        this.active = active;
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
        this.make_button = document.getElementById("make-button");
        this.delete_button = document.getElementById("delete-button");
        this.filename_textfield = document.getElementById("filename-textfield");
        this.enabled_sites_text_area = document.getElementById("enabled-sites-text-area");
        this.position_selection = document.getElementById("position-selection");
        this.mode_selection = document.getElementById("mode-selection");
        this.active_label = document.getElementById("active-label");
        this.active_checkbox = document.getElementById("active-checkbox");
        this.active_div = document.getElementById("active-div");

        // Autosave when changing the position, mode or enabled sites.
        this.active_checkbox.onchange = function(){this.editor.save_current_file()}.bind(this);
        this.position_selection.onkeyup = function(){this.editor.save_current_file()}.bind(this);
        this.position_selection.onchange = function(){this.editor.save_current_file()}.bind(this);
        this.mode_selection.onkeyup = function(){this.editor.save_current_file()}.bind(this);
        this.mode_selection.onchange = function(){this.editor.save_current_file()}.bind(this);
        this.enabled_sites_text_area.onkeyup = function(){this.editor.save_current_file()}.bind(this);
        this.enabled_sites_text_area.onchange = function(){this.editor.save_current_file()}.bind(this);

        this.editor = new Editor(this);
        this.current_menu = "MAIN";
        // These arrays only contain the items that are always there.
        this.main_nav_buttons = [this.js_button,this.css_button,this.html_button];
        this.editor_menu_items = [this.back_div,this.try_button, this.enabled_sites_text_area,this.mode_selection,this.delete_button, this.active_div];
        this.new_menu_items = [this.make_button,this.filename_textfield,this.back_div]; 
        this.nav_items =[];
        this.bind_buttons();
        this.disable_all_menus();
        this.enable_menu_of_kind("MAIN");
        
       
    }
    // binds the correct functions to the buttons.
    // This method should only be run once -> by the constructor.
    bind_buttons()
    {
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
        
        this.reload_button.onclick = function()
        {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
            });
        }
        // Go back to the main menu by clicking the back button.
        this.back_button.onclick = function() 
        {   

            this.disable_all_menus();
            this.enable_menu_of_kind("MAIN");
            // disable the backbutton.
            this.back_div.style.display = "none";
            // change the main nav buttons to be visible.
            this.main_nav_buttons.forEach(function(element)
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
        this.remove_try_button.onclick = function()
        {
            this.remove_try_button.style.display = "none";
            this.try_button.value="Manipulate";
            chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
                {
                    let kind = filename_to_kind(this.editor.active_file);
                    chrome.tabs.sendMessage(tabs[0].id, {todo:"remove"+kind, value: this.editor.active_file});
                }.bind(this))
            show_message("Removed Manipulation");
        }.bind(this)

        this.delete_button.onclick = function()
        {
            if(confirm("Are you sure you want to delete "+this.editor.active_file+"?"))
            {
                // Removes the file-button form the array.
                let index= this.get_nav_item_index_by_title();
                this.nav_items.slice(index,1);
                // Remove the file from the editor.
                this.editor.delete_current_file();
                // Make sure the reloads and the deleted file doesn't show up anymore.
                this.disable_all_menus();
                this.enable_menu_of_kind("MAIN");
                show_message("File Deleted!");
            }
        }.bind(this)

        this.make_button.onclick = function()
        {
            let filename = this.filename_textfield.value;
            // Check if the file already exist by trying to get the current index.
            if(this.get_nav_item_index_by_title(filename) == null)
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

                    let new_nav_item = new File(input, filename,"","","top",this.active_checkbox.checked);
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
                let input = this.add_nav_button(filename);

                // Add functionallity to the button.
                input.onclick = function()
                {
                    this.editor.open_file(filename,filetext);
                    this.disable_all_menus();
                    this.enable_menu_of_kind("EDITOR");
                }.bind(this);

                let nav_item = new File(input, filename,filetext,active_websites,position,mode,active);
                this.nav_items.push(nav_item);
  
            }
            
        }.bind(this));
       
    }
    // Get the index of the specified filename in 'nav_items'.
    get_nav_item_index_by_title(title)
    {
        for(let i=0; i<this.nav_items.length;i++)
        {
            if(this.nav_items[i].title===title)
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
        self=this
        // populate the navbar.
        this.nav_items.forEach(function(element)
        {
            let li = document.createElement('li');
            if(element.active)
            {
                element.element.style.opacity = 1;
            }
            else{
                element.element.style.opacity = 0.5;
            }
            li.appendChild(element.element);
            self.navbar.appendChild(li);
        })
    };

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
                break;
            case "MAIN":
                this.main_nav_buttons.forEach(function(element)
                {
                    element.style.display = "block";
                })
                break;
            case "EDITOR":
                this.editor_menu_items.forEach(function(element)
                {
                    element.style.display = "block";
                })
                
                chrome.tabs.query({active:true, currentWindow:true}, function(tabs)
                {
                    chrome.tabs.sendMessage(tabs[0].id, {todo:"getStatus", value: this.editor.active_file}, function(response) {
                        if(response.response===true)
                        {
                            this.remove_try_button.style.display = "block";
                            this.try_button.value = "Remove Manip."
                        }
                    }.bind(this))
                }.bind(this))

                //only display the position option when html.
                if(this.editor.active_file.endsWith(".html"))
                {
                    this.position_selection.style.display = "block";
                }
                
    
                //add the active websites to the enabled_sites_text_area.
                let index = this.get_nav_item_index_by_title(this.editor.active_file);
                if(this.nav_items[index].active)
                {
                    this.active_checkbox.checked = true;
                }
                else
                {
                    this.active_checkbox.checked = false;
                }
                if(this.nav_items[index])
                {
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
                } 
                break;
            case "NEW":
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
                this.main_nav_buttons.forEach(function(element)
                {
                    element.style.display = "none";
                })
                break;
            case "EDITOR":
                this.editor_menu_items.forEach(function(element)
                {
                    element.style.display = "none";
                })
                // These items aren't in the array because they aren't always there, so we disable them manually.
                this.position_selection.style.display = "none";
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
    }
    
}

function main()
{
    let navigation = new Navigation();
}
