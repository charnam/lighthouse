
// This is a library I've used for a long time, but the code is messy and outdated in some places.
// For readability, this file should have a full rewrite at some point.
// Contributions welcome.


doc = document.documentElement;

Element.prototype.el = function(n) {
    return this.querySelector(n);
};

Element.prototype.attr = function(n, d) {
    if(typeof d !== "undefined"){
        this.setAttribute(n,d);
        return this;
    } else {
        return this.getAttribute(n);
    }
};
Element.prototype.addc = function(n) {
    this.classList.add(n);
    return this;
};
Element.prototype.remc = function(n) {
    this.classList.remove(n);
    return this;
};
Element.prototype.crel = function(n){
    var s = document.createElement(n);
    this.appendChild(s);
    return s;
};
Element.prototype.prel = function(n){
    var s = document.createElement(n);
    this.prepend(s);
    return s;
};
Element.prototype.append = function(n) {
    this.appendChild(n);
    return this;
}
Element.prototype.crelBefore = function(n) {
    var s = document.createElement(n);
    this.insertAdjacentElement("beforebegin", s);
    return s;
}
Element.prototype.crelAfter = function(n) {
    var s = document.createElement(n);
    this.insertAdjacentElement("afterend", s);
    return s;
}

Element.prototype.prnt = function(){
    return this.parentElement;
};
Element.prototype.txt = function(n, d){
    var a;
    if((d === true)) {
        a=document.createTextNode(n+"\n");
    } else {
        a=document.createTextNode(n);
    }
    this.appendChild(a);
    
    return this;
};
Element.prototype.html = function(h){
    this.innerHTML = h;
    return this;
};

Element.prototype.on = function(o, f, e){
    
    this.addEventListener(o, f, e);
    return this;
    
};

Element.prototype.sid = function(id){ // set ID
    
    this.id = id;
    return this;
    
};

Element.prototype.els = function(e) {
    return this.querySelectorAll(e);
}
Element.prototype.styl = function(e, f) {
    this.style[e] = f;
    return this;
}

NodeList.prototype.anim = 
Element.prototype.anim = function(settings) {
    
    var toAnimate = [];
    if(NodeList.prototype.isPrototypeOf(this)) {
        
        toAnimate = [...this];
        
    } else {
        
        toAnimate.push(this);
        
    }
    
    var props = {
        "rotate": {"convert": (e) => e+"deg", "property": "transform"},
        "scale": {"convert": (e) => e, "property": "transform"},
        "scaleX": {"convert": (e) => e, "property": "transform"},
        "scaleY": {"convert": (e) => e, "property": "transform"},
        "translateX": {"convert": (e) => e+"px", "property": "transform"},
        "translateY": {"convert": (e) => e+"px", "property": "transform"},
        "translate": {"convert": (e) => e.map(ae => ae+"px"), "property": "transform"},
        "opacity": {"convert": (e) => e, "property": "opacity"},
        "left": {"convert": (e) => e+"px", "property": "left"},
        "top": {"convert": (e) => e+"px", "property": "top"},
        "width": {"convert": (e) => e+"px", "property": "width"},
        "height": {"convert": (e) => e+"px", "property": "height"},
        "brightness": {"convert": (e) => e, "property": "filter"},
        "blur": {"convert": (e) => e+"px", "property": "filter"},
        "contrast": {"convert": (e) => e, "property": "filter"}
    }
    
    var animations = [];
    Object.entries(settings).forEach(function(setting){
        
        
        if(props[setting[0]]) {
            setting[1].forEach(function(key, index) {
                if(animations[index] == undefined)
                    animations[index] = {};
                    
                    let propValue;
                    let property = props[setting[0]].property;
                    let converted = typeof key == "string" ? key : props[setting[0]].convert(key)
                    if(property == "transform" || property == "filter")
                        propValue = setting[0]+"("+converted+") ";
                    else
                        propValue = converted;
                    
                    if(!animations[index][property])
                        animations[index][property] = propValue;
                    else
                        animations[index][property] += propValue;
                
            });
        }
        
    });
    
    
    toAnimate.forEach(function(animated) {
        
        
        if(settings.startValues || settings.startValues === undefined)
            Object.entries(animations[0]).forEach(function(prop){
                
                animated.style[prop[0]] = prop[1];
                
            })
        
        
    })
    
	let onFinishFunc = null;
    var animation = [];
    var animation_timeouts = [];
    (async function() {
		
		// this is necessary because onfinish may be applied
		// after all animations have started. please find
		// a better solution or rewrite this entire library.
		// what kind of variable name is "aaaaaaa," past me?
		///await new Promise(res => setTimeout(res, 5));
		
		let aaaaaaa;
        for(animae in toAnimate) {
            let animated = toAnimate[animae];
            
            aaaaaaa =
				animated.animate(animations,
                    {
                        duration: settings.duration,
                        iterations: settings.iterations !== undefined ? settings.iterations : 1,
                        easing: settings.easing,
                        direction: settings.direction !== undefined ? settings.direction : "normal"
                    })
            animation.push(
				aaaaaaa
            );
            if(settings.keepValues || settings.keepValues === undefined)
                Object.entries(animations[animations.length-1]).forEach(function(prop){
                    
                    animated.style[prop[0]] = prop[1];
                    
                })
            if(settings.delayBetween && toAnimate.length > 1)
                await new Promise(function(res){let now = Date.now(); animation_timeouts[now] = (setTimeout(function(){ res(); delete animation_timeouts[now]; }, settings.delayBetween))})
            
			if(onFinishFunc)
				aaaaaaa.addEventListener("finish", onFinishFunc);
        }
    })();
    
	let outputElement = this;
    return {
        
        element: this,
        cancel: function(){
            animation.forEach(function(anim){ anim.cancel(); });
            Object.values(animation_timeouts).forEach(function(anim){ clearTimeout(anim); });
        },
        pause: function(){
            animation.forEach(function(anim){ anim.pause(); });
        },
        play: function(){
            animation.forEach(function(anim){ anim.play(); });
        },
        setRate: function(rate){
            animation.forEach(function(anim){ anim.updatePlaybackRate(rate); });
        },
        onfinish: function(func) {
			let hasFinished = false;
			onFinishFunc = () => {
				if(!hasFinished) {
					hasFinished = true;
					func();
				}
			};
			animation.forEach(iteration => iteration.addEventListener("finish", onFinishFunc));
        }
        
    }
    
};


NodeList.prototype.animAsync = 
Element.prototype.animAsync = function(settings) {
    let ae = this;
    return new Promise(function(res) {
        ae.anim(settings).onfinish(function(){ res(ae); });
    });
};

