import "./style/ui.scss";

let main;
let sysTop;
let textDump;

function init(mainDom, zIndex) {
  if (mainDom) {
    main = mainDom;
  } else {
    main = document.querySelector("#main");
    if (!main) main = document.body;
  }

  if (main) {
    sysTop = document.createElement("div");
    sysTop.className = "uiHolderSysTop";
    if (zIndex != undefined) sysTop.style.zIndex = zIndex;
    main.appendChild(sysTop);

    //systemMessage(_spam('this is a test'))

    textDump = document.createElement("input");
    textDump.type = "text";
    textDump.style.position = "fixed";

    textDump.taxindex = "-1";
    textDump.style.display = "none";
    textDump.style.pointerEvents = "none";

    main.appendChild(textDump);
  } else {
    console.error("UI::Uh oh! No system dom element found");
  }

  /*
    	//dev
    	window.addEventListener('keyup',function(ev){
    		if(ev.keyCode==32){
    			let v=Math.random();
    			let type=v>0.2?v>0.4?v>0.6?'warn':'error':'person':'time';
    			
    			systemMessage(_spam('this is a test '),type)
    		}else if(ev.keyCode==90){
    			DEVVAR=systemMessage('No network connection oh darrrrrrn \n We\'ll keep tryna connect in the background ;)','net',true)
    		}else if(ev.keyCode==27){
    			DEVVAR.remove();
    		}
    	})*/
}

function systemMessage(
  m: string,
  type?: { type?: string; color?: string } | string,
  persistent?: boolean,
  timeout: number = 3500
) {
  let dom = document.createElement("div");
  dom.className = "uiSysTop";

  let icon = document.createElement("div");
  let extra = " ";

  if (typeof type === "object" && type !== null) {
    if (type.type) extra += type.type;
    if (type.color) dom.style.backgroundColor = type.color;
  } else {
    switch (type) {
      case "warn":
        extra += "uiIconWarning";
        dom.style.backgroundColor = "#EFEF79";
        break;
      case "error":
        extra += "uiIconError";
        dom.style.backgroundColor = "#D25E5E";
        break;
      case "net":
        extra += "uiIconNet";
        dom.style.backgroundColor = "#FFC65E";
        break;
      case "person":
        extra += "uiIconPerson";
        dom.style.backgroundColor = "#D257FF";
        break;
      case "time":
        extra += "uiIconTime";
        dom.style.backgroundColor = "#5094D9";
        break;
      default:
        extra += "uiIconSuccess";
        dom.style.backgroundColor = "#95F17F";
        break;
    }
  }

  icon.className = "uiIcon" + extra;
  let span = document.createElement("span");
  span.innerText = m;

  span.addEventListener("click", function (ev) {
    _copyText(span);
    cursorMessage("Copied", ev.clientX, ev.clientY);
  });

  dom.appendChild(icon);
  dom.appendChild(span);

  function _endMessage() {
    dom.style.animation = persistent
      ? "0.5s uiSysMini forwards"
      : "0.5s uiSysFold forwards";
    setTimeout(function () {
      if (persistent) {
        dom.style.position = "absolute";
        //dom.style.left = '32px'
        dom.addEventListener("click", function (ev) {
          dom.style.animation = "0.5s uiSysMax forwards";
          setTimeout(function () {
            dom.style.animation = "0.5s uiSysMini forwards";
          }, timeout);
        });
      } else {
        dom.remove();
      }
    }, 500);
  }
  if (!persistent) {
    let closeButton = document.createElement("div");
    closeButton.className = "uiCloseButton";
    dom.appendChild(closeButton);

    closeButton.addEventListener("click", function (ev) {
      _endMessage();
    });
  }

  setTimeout(function () {
    _endMessage();
  }, timeout);

  sysTop.appendChild(dom);
  return dom;
}

function cursorMessage(message: string, x: number, y: number) {
  let dom = document.createElement("div");
  dom.className = "uiCursorMessage";
  dom.style.left = x + "px";
  dom.style.top = y + "px";
  dom.innerText = message;
  main.appendChild(dom);
  setTimeout(function () {
    dom.style.animation = "1s uiFade forwards";
    setTimeout(function () {
      dom.remove();
    }, 1000);
  }, 1500);
}

function _spam(m) {
  let st = "";
  let max = Math.random() * 20;
  for (let i = 0; i < max; i++) {
    st += m;
  }
  return st;
}

function _copyText(dom) {
  textDump.value = dom.innerText;
  textDump.style.display = "block";
  textDump.select();
  //_copyText.setSelectionRange(0, 99999); /*For mobile devices*/

  document.execCommand("copy");
  textDump.blur();
  textDump.style.display = "none";
}

function addConfetti(x, y, angle) {
  let mainDom = document.querySelector("#main");

  let con = document.createElement("div");
  con.classList.add("confetti");
  con.innerHTML =
    '<svg viewbox="0 0 100 100" style="fill:none;stroke:lightgreen;stroke-linecap:round"><path d="M45 70L55 75M45 50L55 50M45 30L55 25" /></svg>';
  con.style.left = x + "px";
  (con.style.top = y + "px"),
    (con.style.transform =
      "translate(-50%,-50%) rotate(" + (angle ? angle : 0) + "deg)");
  setTimeout(function () {
    con.remove();
  }, 500);
  mainDom?.appendChild(con);
}

export { init, systemMessage, cursorMessage, addConfetti };
