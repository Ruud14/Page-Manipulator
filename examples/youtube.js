class YoutubeInator
{
    constructor(value,urls)
    {
        this.value = value;
        this.all_images = document.getElementsByTagName("img");
        this.changed_comments = [];
        this.possible_images = urls;
        this.change_text();
        this.change_dates();
        this.change_commenter();
        this.change_views();
        this.change_video_time();
        this.change_recommended();
    }
    change_text()
    {
        let all_strings = document.getElementsByTagName("yt-formatted-string");
        let all_links = document.getElementsByClassName("yt-simple-endpoint style-scope yt-formatted-string");
        
        for(let el of all_strings)
        {    
            el.innerText = this.value;
        }
        for(let el of all_links)
        {   
            el.innerText = this.value;
        }
    }
    change_dates()
    {
        let all_dates = document.getElementsByClassName("date style-scope ytd-video-secondary-info-renderer");
        for(let date of all_dates)
        {
            date.innerText = "Gepubliceerd op "+this.value+" jan. "+this.value+this.value;
        } 
    }
    change_commenter()
    {
        let all_commenters = document.getElementsByClassName("yt-simple-endpoint style-scope ytd-comment-renderer");
        let all_weird_images = document.getElementsByTagName("yt-img-shadow");
        let show_all_comments = document.getElementsByClassName("style-scope ytd-comment-replies-renderer");
        for(let commenter of all_commenters)
        {
            for(let ch of commenter.childNodes)
            {
                ch.innerText = this.value;
            }
        }
        for(let weird_img of all_weird_images)
        {
            let new_elem = document.createElement("img");
            new_elem.id = "img";
            new_elem.className = "style-scope yt-img-shadow";
            new_elem.alt = this.value;
            new_elem.height="40";
            new_elem.width="40";
            new_elem.src = this.possible_images[Math.ceil(Math.random()*this.possible_images.length)];
            this.changed_comments.push(new_elem);
            weird_img.appendChild(new_elem);
        }
        for(let el of show_all_comments)
        {
            el.innerText = this.value+" antwoorden bekijken"
        }
    }
    change_views()
    {
        let recommended_view_count = document.getElementsByClassName("style-scope ytd-video-meta-block");
        let main_view_count = document.getElementsByClassName("view-count style-scope yt-view-count-renderer");
        for(let view of main_view_count)
        {
            view.innerText = this.value+" weergaven";
        }
        for(let view of recommended_view_count)
        {
            if(view.id === "additional-metadata-line")
            {
                view.innerText = this.value+" weergaven";
            }
            else{
                view.innerText = this.value;
            }
        }
    }
    change_video_time()
    {
        let current_time = document.getElementsByClassName("ytp-time-current");
        let full_time = document.getElementsByClassName("ytp-time-duration");
        for(let c of current_time)
        {
            c.innerText = this.value+":"+this.value;
        }
        for(let f of full_time)
        {
            f.innerText = this.value+":"+this.value+":"+this.value;
        }
    }
    change_recommended()
    {
        let video_titles = document.getElementsByClassName("style-scope ytd-compact-video-renderer");
        for(let el of video_titles)
        {
            if(el.id === "video-title")
            {
                el.label = this.value;
                el.title = this.value;
                el.innerText = this.value;
            }
        }    
    }
    mlg()
    {
        setInterval(function()
            { 
                for(let cc of this.changed_comments)
            {
                cc.src = this.possible_images[Math.ceil(Math.random()*this.possible_images.length)];
            }
            for(let img of this.all_images)
            {
                img.src = this.possible_images[Math.ceil(Math.random()*this.possible_images.length)];
            }
        }.bind(this), 100);
        
    }
}
let urls = ["https://static.wixstatic.com/media/c17790_7fc736202c6f4453becc6e7a0f143ce0~mv2.jpg","https://upload.wikimedia.org/wikipedia/en/a/a9/Plat_13.png","https://cdn.macrumors.com/article-new/2019/01/ios13roundupheadertemp.jpg","https://upload.wikimedia.org/wikipedia/commons/c/c9/13_white%2C_blue_rounded_rectangle.svg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Canal_13_de_Chile_%28Isotipo_2018%29.svg/1200px-Canal_13_de_Chile_%28Isotipo_2018%29.svg.png","http://images.tritondigitalcms.com/6616/sites/689/2017/01/27001222/Unlucky-Number-13-v1.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/9/91/Junction_13.svg","https://weeknumber.net/gfx/200x200/13.png","https://piratenpartij.nl/wp-content/uploads/2019/02/art13graffiti-square.jpg","https://www.worldnumerology.com/images/13.png",
        "https://media.istockphoto.com/photos/number-13-outlined-in-festive-sparkler-lights-picture-id157645244?k=6&m=157645244&s=612x612&w=0&h=oRxgx0rjhCIKp-Q5UrEUk9T1dCyLvP1hC7zKRJM9qPs=",
        "http://numerologystars.com/wp-content/uploads/2011/12/number-13-2.jpg","https://www.drodd.com/images15/13-24.png","https://jacobsmedia.com/wp-content/uploads/2019/04/13.jpg","https://crossfitroundrocktx.com/wp-content/uploads/2018/06/chapter-13-bankruptcy-california.jpg"];

setTimeout(function()
{ 
    let yeet = new YoutubeInator("13",urls);
    yeet.mlg();
}, 3000);

    
