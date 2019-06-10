window.onload = function statup()
{
    main()
}


class Editor
{
    constructor()
    {
        this.files = [];
        this.max_open_files = 6;
    }
    add(title, text)
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
            }
        }
        else
        {
            alert("Close some files first.")
        }
    }
    activate_file_by_name(title)
    {
        let all_textfields = document.getElementsByClassName("textfield");
            Array.from(all_textfields).forEach(function(element)
            {
                // Enable the right text area.
                if(element.id == "textfield-"+title)
                {
                    element.style.display = 'block';
                }
                // Disable all other textareas
                else
                {  
                    element.style.display = 'none';
                }
            })
    }
    make_button_active(title)
    {
        let all_buttons = document.getElementsByClassName("file-title-button");
        Array.from(all_buttons).forEach(function(element)
        {
            // make the button active
            if(element.value==title)
            {
                element.style.backgroundColor="#222222";
            }
            // make the other buttons inactive.
            else
            {
                element.style.backgroundColor="#444444";
            }
        })
        
    }
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
            let all_open_files = document.getElementsByClassName("open-files-list-item");
            let all_textfields = document.getElementsByClassName("textfield");
            //Delete the file button.
            Array.from(all_open_files).forEach(function(element)
            {
                if(element.childNodes[0].value == title)
                {
                    element.parentNode.removeChild(element);
                }
            })
            
            //Delete the textarea.
            Array.from(all_textfields).forEach(function(element)
            {
                if(element.id == "textfield-"+title)
                {
                    element.parentNode.removeChild(element);
                }
            })
            // Remove the file from this.files.
            for(let i=0; i<self.files.length;i++)
            {
                if(self.files[i] == title)
                {
                    self.files.splice(i,1);
                }
            }
            
        }
        file_button.type="submit";
        file_button.className="file-title-button";
        file_button.value=title;
        self=this;
        file_button.onclick = function()
        {
            self.activate_file_by_name(title);
            self.make_button_active(title);
        }
        li.appendChild(file_button);
        li.appendChild(close_button);
        ul.appendChild(li);
        this.make_button_active(title);
        this.files.push(title);
    }
    create_window(title,text)
    {
        let write_area = document.getElementById("write-area");
        let textfield = document.createElement('textarea');
        let textnode = document.createTextNode(text);
        textfield.className = "textfield";
        textfield.id = "textfield-"+title;
        textfield.appendChild(textnode);
        write_area.appendChild(textfield);
    }
}

let editor = new Editor();

class SavedNavItem
{
    constructor(title, kind, text)
    {
        this.title = title;
        this.text = text;
        // make the html element for the SavedNavItem object.
        if(kind === "JS" || kind==="CSS" || kind==="HTML")
        {
            let input = document.createElement('input');
            input.type = 'submit';
            input.value = title;
            input.className = 'nav-button saved-'+kind.toLowerCase()+'-nav-button'
            // Add functionallity to the buttons.
            
            input.onclick = function()
            {
                //alert(text);
                editor.add(title,text);
            }
            this.element = input;
        }
    }
}

function main()
{
    navigation();
}

function navigation()
{
    let current_menu = "MAIN";
    let navbar = document.getElementById("navbar");
    let back_button = document.getElementById("back-button");
    let new_button = document.getElementById("new-button");
    let js_button = document.getElementById("JS-button");
    let css_button = document.getElementById("CSS-button");
    let html_button = document.getElementById("HTML-button");
    let main_nav_buttons = [js_button,css_button,html_button];
    let js_nav_buttons = [];
    let css_nav_buttons = [];
    let html_nav_buttons = [];

    //Add the saved files to the html file an disbale them.

    function make_test_nav_items()
    {
        for(let i=0; i<5;i++)
        {
            let test_js_nav_item = new SavedNavItem(i+'.js',"JS","JA DIS IS WA JS TEXT");
            let test_css_nav_item = new SavedNavItem(i+'.css',"CSS","JA DIS IS WA CSS TEXT");
            let test_html_nav_item = new SavedNavItem(i+'.html',"HTML","JA DIS IS WA HTML TEXT");
            css_nav_buttons.push(test_css_nav_item);
            html_nav_buttons.push(test_html_nav_item);
            js_nav_buttons.push(test_js_nav_item);
        }
    }

    // Creates html elements from the saved files.
    function make_nav_items()
    {
        js_nav_buttons.forEach(function(element)
        {
            let li = document.createElement('li');
            li.appendChild(element.element);
            navbar.appendChild(li);
        })
        css_nav_buttons.forEach(function(element)
        {
            let li = document.createElement('li');
            li.appendChild(element.element);
            navbar.appendChild(li);
        })
        html_nav_buttons.forEach(function(element)
        {
            let li = document.createElement('li');
            li.appendChild(element.element);
            navbar.appendChild(li);
        })
        disable_all_non_main_menus();
    };


    make_test_nav_items();
    make_nav_items();

    // Disables all main menu buttons.
    function disable_main_menu()
    {
        main_nav_buttons.forEach(function(element)
        {
            element.style.display = "none";
        })
    };

    // Enables all main menu buttons.
    function enable_main_menu()
    {
        main_nav_buttons.forEach(function(element)
        {
            element.style.display = "block";
        })
        current_menu = "MAIN";
    };

    // Enables the specified menu. options: JS, CSS, HTML
    function enable_menu_of_kind(kind)
    {
        if(kind === "JS" || kind==="CSS" || kind==="HTML")
        {
            disable_main_menu();
            back_button.style.display = "block";
            let all_elements = document.getElementsByClassName('saved-'+kind.toLowerCase()+'-nav-button');
            Array.from(all_elements).forEach(function(element)
            {
                element.style.display = "block";
            })
            new_button.style.display = "block";
            current_menu = kind;
        }
    }

    // Disables the specified menu. options: JS, CSS, HTML
    function disable_menu_of_kind(kind)
    {
        if(kind === "JS" || kind==="CSS" || kind==="HTML")
        {
            enable_main_menu();
            back_button.style.display = "none";
            let all_elements = document.getElementsByClassName('saved-'+kind.toLowerCase()+'-nav-button');
            Array.from(all_elements).forEach(function(element)
            {
                element.style.display = "none";
            })
            new_button.style.display = "none";
        }
    }

    // Disables the JS, CSS and HTML menus.
    function disable_all_non_main_menus()
    {
        disable_menu_of_kind("JS");
        disable_menu_of_kind("CSS");
        disable_menu_of_kind("HTML");
    }
    // Change the page to the javascript page.
    js_button.onclick = function()
    {   
        //enable all the saved javascript files.
        enable_menu_of_kind("JS");
    };

    // Change the page to the CSS page.
    css_button.onclick = function()
    {   
        //enable all the saved javascript files.
        enable_menu_of_kind("CSS");
    };

    // Change the page to the HTML page.
    html_button.onclick = function()
    {   
        //enable all the saved HTML files.
        enable_menu_of_kind("HTML");
    };

    // Go back to the main menu by clicking the back button.
    back_button.onclick = function() 
    {   
        disable_all_non_main_menus();
        // disable the backbutton.
        back_button.style.display = "none";
        // change the main nav buttons to be visible.
        main_nav_buttons.forEach(function(element)
        {
            element.style.display ="block";
        })
        new_button.style.display = "none";
    };

    // Create new file.
    new_button.onclick = function()
    {
        //open the editor.
        alert("open "+current_menu+" editor");
    }
}
