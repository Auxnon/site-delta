// import * as Online from "../Online";
import * as Helper from "../Helper";
import { systemInstance } from "../Main";
import * as THREE from "../lib/three.module";

import "../style/chatStyle.css";
import App from "../types/App";

//pass in name, and a pointer to a complete function which dictates everything has loaded,
//we keep track inside the mini class by counting  resources and incrementing till count is complete then, complte()
//animate is called every render, deint... not used yet

export default class Chat extends App {
  chatWrapper; //holds all chat app elements, not the canvas as usual
  chatPane: HTMLElement; //holds only actual chat bubbles
  //let chatBlock;
  chatInput; //text entry
  timestampRefreshCounter = 0;

  //only matters to admin (me?)
  loginMenu;
  roomHider;
  roomSwitcher;
  roomDeleter;

  pastDom = null;
  pastPlayerName = "";
  lastDom = null;
  lastPlayerName = "";

  constructor(dom) {
    super(dom);
    //let scene = new THREE.Scene();

    systemInstance.shrinkTitle();
    this.initChat(dom);
    // Online.guest();
    //return scene;
    this.resolver();
  }

  //runs every frame
  animate(delta) {
    this.timestampRefreshCounter += delta;
    if (this.timestampRefreshCounter >= 4) {
      this.timestampRefreshCounter = 0;
      this.refreshTimestamps();
    }
  }

  //unused for now, would deload everything for memory reasons
  deinit() {}

  //called when toggled to this app, on a page load with app ideally it would run init and immediately run open after
  //also passes in the canvas in case the app wants to do something wacky with it like resize it or place it somewhere else
  //return true if changes were made and it wont follow the default
  open(canvas) {
    systemInstance.shrinkTitle();
    //if(chatInput)
    this.chatWrapper.style.display = "";
    this.chatInput.focus();
    this.timestampRefreshCounter = 180;
  }
  //called when app is closed out for another one
  close() {
    this.chatWrapper.style.display = "none";
  }

  adjust(pos) {
    this.chatWrapper.style.left = 0;
    this.chatWrapper.style.top = 0;
    switch (pos) {
      case 0:
        this.chatWrapper.style.width = "calc(100% - 128px)";
        this.chatWrapper.style.height = "100%";
        this.chatWrapper.style.left = "128px";
        break;
      case 2:
        this.chatWrapper.style.width = "calc(100% - 128px)";
        this.chatWrapper.style.height = "100%";
        break;
      case 3:
        this.chatWrapper.style.width = "100%";
        this.chatWrapper.style.height = "calc(100% - 128px)";
        this.chatWrapper.style.top = "128px";
        break;

      default:
        this.chatWrapper.style.width = "100%";
        this.chatWrapper.style.height = "calc(100% - 128px)";
    }
  }

  initChat(mainDom) {
    this.chatWrapper = this.div("chat-wrapper");
    this.chatPane = this.div("chat-pane");

    //mainDom.appendChild(chatButton);
    this.chatWrapper.appendChild(this.chatPane);
    this.chatWrapper.style.height = "calc(100% - 128px)"; //FIX should set this based on bar pos
    //mainDom.appendChild(chatBlock);

    let chatBottom = this.div("chat-bottom");

    this.chatInput = document.createElement("input");
    let color = "black"; //"0xffff55"; //World.getOwnPlayer().color
    //color = '#' + color.substring(2, color.length);
    this.chatInput.placeholder = "Send me a message!";
    this.chatInput.style.border = color + " 6px solid";
    chatBottom.appendChild(this.chatInput);

    //Drawer.makeButton(chatBottom,'chat')

    let sendButton = document.createElement("div");
    sendButton.className = "chat-send-button";
    sendButton.addEventListener("click", this.submit);
    chatBottom.appendChild(sendButton);

    //let toggle=document.createElement('div');
    //toggle.classList.add('chatToggle');
    //bottom.appendChild(toggle);

    this.chatWrapper.appendChild(chatBottom);

    //chatBlock.style.left='100%';

    /*
        chatButton.addEventListener('click',function(ev){
            Control.addConfetti(window.innerWidth-30,window.innerHeight-30,225);
            openChat();
        })*/
    /*
        chatPane.addEventListener('click',function(ev){
            closeChat();
        })
    */
    this.chatInput.addEventListener("keyup", (ev) => {
      if (ev.which == 13) {
        if (this.chatInput.value.length > 0) {
          //|| Drawer.getState() == 'chat') {
          this.submit();
        } else {
          setTimeout(this.closeChat, 20);
        }
      } else if (ev.which == 27) {
        this.closeChat();
      }
    });
    /*toggle.addEventListener('click',function(ev){
        if(toggle.classList.contains('chatToggle')){
            toggle.classList.remove('chatToggle');
            toggle.classList.add('mailToggle');
        }else{
            toggle.classList.remove('mailToggle');
            toggle.classList.add('chatToggle');
        }

    })*/

    //s
    //World.socket.on('chat', chatHook);

    this.loginMenu = this.div("login-menu");
    let name = document.createElement("input");
    let pass = document.createElement("input");
    let passButton = document.createElement("button");
    pass.setAttribute("type", "password");
    passButton.innerText = "Submit";

    this.loginMenu.appendChild(name);
    this.loginMenu.appendChild(pass);
    this.loginMenu.appendChild(passButton);
    passButton.addEventListener("click", (ev) => {
      // Online.login(name.value, pass.value);
      this.loginMenu.style.display = "";
    });
    this.roomSwitcher = this.div("room-switcher");
    this.roomSwitcher.style.display = "none"; //explicitly set this so it's easier to toggle
    this.roomHider = this.div("room-switcher-hider");
    this.roomHider.style.display = "none";
    this.roomHider.addEventListener("click", (ev) => {
      this.wiggleElement(ev.target);

      if (this.roomSwitcher.style.display == "none") {
        this.roomDeleter.style.display = "";
        this.roomSwitcher.style.display = "";
      } else {
        this.roomDeleter.style.display = "none";
        this.roomSwitcher.style.display = "none";
      }
    });
    this.roomDeleter = this.div("room-deleter");
    this.roomDeleter.style.display = "none";
    this.roomDeleter.addEventListener("click", (ev) => {
      this.wiggleElement(ev.target);
      // Online.deleteRoom();
    });
    mainDom.appendChild(this.roomDeleter);
    this.chatWrapper.appendChild(this.roomHider);

    this.chatWrapper.appendChild(this.roomSwitcher);
    mainDom.appendChild(this.chatWrapper);
    mainDom.appendChild(this.loginMenu);
  }

  wiggleElement(ele) {
    ele.style.animation = "";
    void ele.offsetWidth;
    ele.style.animation = "wiggle 0.4s";
  }

  div(classname) {
    let ele = document.createElement("div");
    ele.className = classname;
    return ele;
  }

  addBubble(s, player, timestamp) {
    let chatBubble = document.createElement("p");
    let color = player.color;
    //chatBubble.style.border=color+' solid 6px'
    chatBubble.style.backgroundColor = color;

    let bool = Helper.testBW(Helper.hexToRGB(color));

    chatBubble.style.color = bool ? "#000000" : "#FFFFFF";
    chatBubble.style.textShadow =
      "1px 1px 2px " + (bool ? "#FFFFFF" : "#000000");

    let imageIndex = s.indexOf("data:image");
    if (imageIndex > -1) {
      let lastIndex = s.indexOf("#", imageIndex);
      if (lastIndex > -1) {
        let imgString = s.substring(imageIndex, lastIndex);
        console.log(imgString);
        let img = new Image();
        img.className = "stretch-image";
        img.src = imgString;
        chatBubble.appendChild(img);
        s = s.substring(lastIndex + 1);
      }
    }

    if (s == "&&&pp&&&") {
      this.loginMenu.style.display = "block";
    }

    /*let stt=s.split('');
    stt.forEach((c,i)=>{
        let sp=document.createElement('span');
        sp.style.animationDelay=(i*0.03 +Math.random()/10)+'s';
        sp.innerHTML=c;
        if(c==' ')
            sp.innerHTML='&nbsp'
        chatBubble.appendChild(sp)
    })
    setTimeout(function(){
        chatBubble.innerHTML=s;
    },(s.length*0.03+2)*1000)*/
    chatBubble.innerText += s;

    let chatRow = document.createElement("div");
    chatRow.classList.add("chat-row");

    // if (player.username == Online.getUsername())
    //   chatRow.classList.add("chat-right");

    chatBubble.classList.add("chat-bubble");

    let chatTime = document.createElement("span");
    chatTime.className = "chat-timestamp";
    chatTime.innerText = this.timeFormat(timestamp);
    chatTime.setAttribute("time", timestamp);
    if (this.lastPlayerName && this.lastPlayerName == player.username) {
      if (this.pastPlayerName == player.username) {
        // this.lastDom.classList.remove("chat-bubble-footer");
        // this.lastDom.classList.add("chat-bubble-body");
      } else {
        // this.lastDom.classList.add("chat-bubble-header");
      }
      //lastDom.classList.remove("chatBubbleHeader","chatBubbleBody")

      chatBubble.classList.add("chat-bubble-footer");
    } else {
      let nameTag = document.createElement("p");
      nameTag.classList.add("chat-nametag");
      nameTag.innerText = player.username;
      let tagRow = document.createElement("div");
      // if (player.username == Online.getUsername())
      //   tagRow.style.textAlign = "right";
      //nameTag.style.background=color;
      tagRow.appendChild(nameTag);
      this.chatPane.appendChild(tagRow);
    }

    this.pastDom = this.lastDom;
    this.pastPlayerName = this.lastPlayerName;
    // this.lastDom = chatBubble;
    this.lastPlayerName = player.username;

    // if (player.username == Online.getUsername()) {
    //   chatRow.appendChild(chatTime);
    //   chatRow.appendChild(chatBubble);
    // } else {
    //   chatRow.appendChild(chatBubble);
    //   chatRow.appendChild(chatTime);
    // }

    this.chatPane.appendChild(chatRow);
    this.chatPane.scrollTo(0, this.chatPane.scrollHeight);

    return chatBubble;
  }

  submit() {
    if (this.chatInput.value.length > 0) {
      //redundant
      let message = "";
      /*if (Drawer.getState() == 'chat') {
            message += Drawer.getData() + '#'
            Drawer.close();
        }*/
      message += this.chatInput.value;
      // Online.message(message);
      this.chatInput.value = "";
    }
  }

  hook(username, message, timestamp) {
    let player;
    let color = "#8A0";
    if (username.startsWith("Guest")) {
      //not bothering with user colors for now
      color = "#fff";
    } else if (username == "System") {
      color = "#f50";
    }
    /*if(player){ //TODO
        color=player.color;
        color='#'+color.substring(2,color.length);

        

        
        let anchor=addBubble(message,player,color,player.model);
        setTimeout(function(){
            anchor.bubble.remove();
            anchor.bubble=null;
        },8000)
    }*/
    //if(!Control.isMenuLocked())
    //  Control.addConfetti(window.innerWidth-30,window.innerHeight-30,225);
    if (!player) player = { username, id: -1, color };
    this.addBubble(message, player, timestamp);
    //BarUI.setNotifier(2, 1)
  }

  lastChats(chats) {
    chats.forEach((chat) => {
      this.hook(chat[1], chat[2], chat[0]);
    });
    //makeDivider('Last 10 messages')
  }

  // function openChat() {
  //   if (!Control.isMenuLocked()) {
  //     //chatBlock.style.left='0%';
  //     //addBubble('test text for great prosperity','red');
  //     //chatInput.focus();
  //     //Control.lockMenu(true);
  //   }
  //   chatInput.focus();
  // }

  closeChat() {
    //chatBlock.style.left='100%';
    this.chatInput.blur();
    //BarUI.closeApp();
    //Control.lockMenu(false);
  }

  makeDivider(message) {
    let dom = document.createElement("div");
    dom.className = "chat-divider";
    let p = document.createElement("p");
    p.innerText = message;
    dom.appendChild(p);
    this.chatPane.appendChild(dom);
    this.lastPlayerName = "";
    this.pastPlayerName = "";
  }
  /*
function setSize(bool) {
    if (!chatPane || !chatBottom)
        return
    if (bool) {
        chatPane.style.height = 'calc(100vh - 100px)';
        chatBottom.style.bottom = '100px'
    } else {
        chatPane.style.height = 'calc(100vh - 64px)';
        chatBottom.style.bottom = '0px'
    }
}
*/
  // function popBubble(anchor) {
  //   anchor.bubble.remove();
  //   anchor.bubble = null;
  // }

  // function updateBubble(anchor) {
  //   anchor.bubble;
  // }

  setRooms(guests) {
    this.roomSwitcher.querySelectorAll(".room-button").forEach((r) => {
      r.removeEventListener("click", this.roomClick);
      r.remove();
    });
    guests.forEach((guest) => {
      let room = this.div("room-button");
      room.innerText = guest.room != undefined ? guest.room : "???";
      room.addEventListener("click", this.roomClick);
      this.roomSwitcher.appendChild(room);
    });
  }

  roomClick(ev) {
    let t = ev.target.innerText;
    // if (t != "???") Online.switchRoom(t);
  }

  clear() {
    Object.values(this.chatPane.children).forEach((child) => {
      child.remove();
    });
  }

  unhideAdmin() {
    this.roomHider.style.display = "";
  }

  offline() {
    let banner = this.div("chat-banner");
    banner.innerText = "Offline\nReload site 😵";
    this.chatPane.appendChild(banner);
  }

  timeFormat(time) {
    let diff = (Date.now() - time) / 1000;
    let hoursRaw = diff / 3600;
    let hours = Math.floor(hoursRaw);
    let minutesRaw = (hoursRaw - hours) * 60;
    let minutes = Math.floor(minutesRaw);
    let seconds = Math.floor((minutesRaw - minutes) * 60);

    let finalString = hours > 0 ? hours + "hours " : "";
    finalString += minutes > 0 ? minutes + "mins " : "";
    finalString += seconds > 0 ? seconds + "secs " : "";
    if (finalString.length > 0) finalString += "ago";
    return finalString;
  }

  refreshTimestamps() {
    // let stamps = this.chatPane.querySelectorAll(".chat-timestamp");
    // stamps.forEach((stamp: HTMLElement) => {
    //   let n = parseInt(stamp.getAttribute("time"));
    //   if (!isNaN(n)) stamp.innerText = this.timeFormat(n);
    // });
  }
}
