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
            date.innerText = "Published on "+this.value;
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
            el.innerText = this.value+" see answers"
        }
    }
    change_views()
    {
        let recommended_view_count = document.getElementsByClassName("style-scope ytd-video-meta-block");
        let main_view_count = document.getElementsByClassName("view-count style-scope yt-view-count-renderer");
        for(let view of main_view_count)
        {
            view.innerText = this.value+" views";
        }
        for(let view of recommended_view_count)
        {
            if(view.id === "additional-metadata-line")
            {
                view.innerText = this.value+" views";
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
let urls = ["https://orig00.deviantart.net/32bd/f/2018/245/4/0/untitled_drawing_by_azuraring-dcltymr.png","https://www.pngfind.com/pngs/m/183-1831028_mlg-mlg-mlg-8-bit-finn-the-human.png",
            "https://i.kym-cdn.com/entries/icons/original/000/027/027/5gwo9dcm1rh11.png","https://i.ytimg.com/vi/0NfTVytat_E/maxresdefault.jpg",
            "https://i.kym-cdn.com/entries/icons/original/000/030/115/cover4.jpg","https://i.kym-cdn.com/entries/icons/original/000/021/971/Salt-Bae-001.jpg","https://images-i.jpimedia.uk/imagefetch/c_fill,f_auto,h_1133,q_auto:eco,w_1700/https://inews.co.uk/wp-content/uploads/2016/09/pepehead.jpg",
           "https://i1.wp.com/chartcons.com/wp-content/uploads/Funniest-Ginger-Jokes-3.jpg?fit=1024%2C768&ssl=1","https://www.24fun.me/wp-content/uploads/2019/05/Funny-videos-2017-funny-vines-try-not-to-laugh-challenge.jpg","https://image.shutterstock.com/image-photo/funny-man-watermelon-helmet-googles-260nw-157354478.jpg"]
setTimeout(function()
{ 
    let yeet = new YoutubeInator("yeet",urls);
    yeet.mlg();
}, 3000);

    
