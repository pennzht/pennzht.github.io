function touchstart(event){
    event.preventDefault();
    var changes = event.changedTouches;
    for (var i=0; i<changes.length; i++){
        touchid ++;
        touches["a"+touchid] = {x: changes[i].pageX, y: changes[i].pageY, color: colors[touchid%8]};
    }
    redraw();
}

function touchmove(event){
    event.preventDefault();
    var changes = event.changedTouches;
    for (var i=0; i<changes.length; i++){
        var touchindex = findnearest(changes[i].pageX, changes[i].pageY);
        touches[touchindex].x = changes[i].pageX;
        touches[touchindex].y = changes[i].pageY;
    }
    redraw();
}

function touchend(event){
    event.preventDefault();
    var changes = event.changedTouches;
    for (var i=0; i<changes.length; i++){
        var touchindex = findnearest(changes[i].pageX, changes[i].pageY);
        delete touches[touchindex];
    }
    redraw();
}

function findnearest(x, y){
    var index = false;
    var d = Infinity;
    for (var i in touches){
        var thisd = squaredistance(x, y, touches[i].x, touches[i].y);
        if (thisd < d){
            index = i;
            d = thisd;
        }
    }
    return index;
}

function squaredistance(x0, y0, x1, y1){
    return (x0-x1)*(x0-x1) + (y0-y1)*(y0-y1);
}

function redraw(){
    c.fillStyle = "#fdf6e3";
    c.fillRect(0, 0, canvaselement.width, canvaselement.height);
    for (var i in touches){
        c.fillStyle = touches[i].color;
        c.beginPath();
        c.arc(touches[i].x, touches[i].y, 50, 0, 2*Math.PI);
        c.fill();
    }
}

function resize(){
    canvaselement.width = window.innerWidth;
    canvaselement.height = window.innerHeight;
    redraw();
}

function init(){
    canvaselement = document.getElementById("C");
    c = canvaselement.getContext("2d");
    document.addEventListener("touchstart", touchstart, {passive:false});
    document.addEventListener("touchend", touchend, {passive:false});
    document.addEventListener("touchcancel", touchend, {passive:false});
    document.addEventListener("touchmove", touchmove, {passive:false});
    colors = ["#b58900", "#cb4b16", "#dc322f", "#d33682", "#6c71c4", "#268bd2", "#2aa198", "#859900"];
    touches = {};
    touchid = -1;
    resize();
    redraw();
    window.addEventListener("resize", resize);
}

////////////////////////////////////////////////////////////////

/*

function logevent(label){
    return (event) => {
        var e = event;
        e.preventDefault();
        var y = label;
        var changes = e.changedTouches;
        y += changes.length;
        for (var i=0; i<changes.length; i++){
            y += ("[" + changes[i].clientX + "," + changes[i].clientY + "]");
        }
        console.log(e);
        console.log(y);
        redraw(changes);
    }
}

*/
