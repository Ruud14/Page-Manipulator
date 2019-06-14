var original = Runner.prototype.gameOver;
main();
window.onload = function statup()
{
    main()
}
let restart= true;
function enable_god_mode()
{
    Runner.prototype.gameOver = function(){};
}

function enable_speed()
{
    if(Runner.instance_)
        Runner.instance_.setSpeed(1000);
}

function add_buttons()
{
    let button = document.createElement("input");
    let body = document.body;
    body.innerHTML= request.code + body.innerHTML;
}

function main()
{

    setInterval(function()
    { 
        if(Runner.instance_.started && Runner.instance_.isRunning())
        {
            if(restart)
            {
                alert("Started");
                enable_god_mode();
                restart = false;
            }
        }
        else
        {
            restart = true;
        }
    }, 1000);
        
}

