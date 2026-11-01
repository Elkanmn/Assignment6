/* Assignment 6 — jQuery only. All guest information comes from this array. */
$(function () {
  "use strict";
  const motionMode = $("body").data("mode") === "task2";
  const colorCodes = {red:"#d64f5c", blue:"#5d8be8", green:"#38a27d", black:"#333a4d", yellow:"#e5aa35", purple:"#9f67ce"};
  const itemIcons = {phone:"📱", glasses:"👓", bag:"👜", cup:"☕", crumbs:"🍰"};
  const itemNames = {phone:"a phone", glasses:"glasses", bag:"a bag", cup:"a cup", crumbs:"cake crumbs"};
  const baseParty = [
    {id:"balcony", name:"Balcony", floor:2, guests:[
      {name:"Aigerim", color:"green", time:"20:45", aitu:true, things:["cup","crumbs"]},
      {name:"Aliya", color:"black", time:"21:15", aitu:false, things:["phone","cup"]},
      {name:"Madina", color:"green", time:"22:10", aitu:false, things:["phone","bag","crumbs"]},
      {name:"Ivan", color:"black", time:"20:10", aitu:true, things:["cup"]}
    ]},
    {id:"hall", name:"Hall", floor:2, guests:[
      {name:"Arman", color:"yellow", time:"20:35", aitu:false, things:["bag","glasses"]},
      {name:"Sophia", color:"purple", time:"21:20", aitu:true, things:["phone"]},
      {name:"Dias", color:"green", time:"19:45", aitu:true, things:[]},
      {name:"Bekzat", color:"purple", time:"20:55", aitu:false, things:["bag","cup","crumbs"]},
      {name:"Aruzhan", color:"blue", time:"21:50", aitu:true, things:["phone"]},
      {name:"Saule", color:"green", time:"21:25", aitu:false, things:["glasses"]}
    ]},
    {id:"kitchen", name:"Kitchen", floor:1, guests:[
      {name:"Nurlan", color:"red", time:"19:40", aitu:true, things:["phone","cup"]},
      {name:"Emma", color:"black", time:"20:15", aitu:false, things:["bag"]},
      {name:"Timur", color:"green", time:"21:05", aitu:true, things:["phone","bag","crumbs"]},
      {name:"Sergey", color:"yellow", time:"20:50", aitu:false, things:[]},
      {name:"Yerlan", color:"red", time:"21:40", aitu:true, things:["glasses","phone"]},
      {name:"Kamila", color:"green", time:"20:05", aitu:false, things:["cup"]}
    ]},
    {id:"living", name:"Living room", floor:1, guests:[
      {name:"Daniel", color:"blue", time:"19:55", aitu:true, things:["glasses"]},
      {name:"Zarina", color:"green", time:"21:10", aitu:false, things:["bag","phone","crumbs"]},
      {name:"Natasha", color:"yellow", time:"20:30", aitu:true, things:[]},
      {name:"Askar", color:"black", time:"21:00", aitu:true, things:["phone"]},
      {name:"Inkar", color:"purple", time:"20:20", aitu:false, things:["bag"]}
    ]}
  ];
  // The mutable copy is also updated when a guest moves to another room.
  const party = $.extend(true, [], baseParty);
  const sortState = {balcony:false, hall:false, kitchen:false, living:false};
  let moving = false;
  let modalOpen = false;
  let modalGuest = null;
  let modalAvatarRect = null;

  const cases = [
    "Who is in the hall?",
    "Who is dressed in yellow or purple?",
    "Which AITU students are upstairs?",
    "Who has glasses or a bag?",
    "Who came with nothing at all?",
    "Who has a phone but no bag?",
    "Who arrived from 20:30 to 21:00?",
    "Who came after 21:00 and is not AITU?",
    "Who stands right next to Askar?",
    "Who stands last in each room?",
    "Who stands third in each room?",
    "Who stands after Timur?",
    "Who stands before someone in black?",
    "In which room is Aruzhan?",
    "Which rooms have fewer than 6 guests?",
    "Which rooms have a cup but no glasses?",
    "Who arrived first in each room?",
    "Miras joins between Askar and Inkar",
    "Natasha leaves the party",
    "Who took the cake?"
  ];

  function avatarUrl(name) {
    return (window.avatarData && window.avatarData[name.toLowerCase()]) || "../assets/avatars/" + name.toLowerCase() + ".svg";
  }

  function makeGuest(g, order) {
    const $guest = $("<div>", {"class":"guest", tabindex:0, role:"button", "aria-label":"Show " + g.name + "'s details"});
    $guest.attr({"data-name":g.name, "data-color":g.color, "data-time":g.time,
      "data-aitu":String(g.aitu), "data-order":order});
    Object.keys(itemIcons).forEach(item => $guest.attr("data-"+item, String(g.things.includes(item))));
    $guest.addClass("color-" + g.color + (g.aitu ? " is-aitu" : ""));
    $guest.css("--guest-color", colorCodes[g.color]);
    const $avatar = $("<div>", {"class":"avatar-wrap"});
    $avatar.append($("<img>", {src:avatarUrl(g.name), alt:"Portrait of "+g.name}));
    if(g.aitu) $avatar.append($("<span>", {"class":"aitu-mark", title:"AITU student",text:"A"}));
    $guest.append($avatar, $("<div>", {"class":"guest-name",text:g.name}),
      $("<div>", {"class":"guest-time",text:"◷ " + g.time}));
    const $things = $("<div>", {"class":"things"});
    if(g.things.length === 0) $things.append($("<span>", {"class":"no-things",text:"—"}));
    g.things.forEach(thing => $things.append($("<span>", {"class":"thing",text:itemIcons[thing], title:itemNames[thing]})));
    return $guest.append($things);
  }

  function renderHouse() {
    $(".room-guests .guest").stop(true, true);
    $("#floor1, #floor2").empty();
    party.forEach(room => {
      const $room = $("<section>", {"class":"room", "data-room":room.id, "data-floor":room.floor});
      const $head = $("<div>", {"class":"room-head"});
      $head.append($("<h3>").text(room.name).append($("<span>", {"class":"tag",text:room.floor === 2 ? "UPSTAIRS" : "DOWNSTAIRS"})));
      if(motionMode) $head.append($("<button>", {"type":"button","class":"sort-btn",text:"↕ Sort by time", "data-room":room.id}));
      const $guests = $("<div>", {"class":"room-guests"});
      room.guests.forEach((guest, i) => $guests.append(makeGuest(guest, i)));
      $room.append($head,$guests).appendTo(room.floor === 2 ? "#floor2" : "#floor1");
      sortState[room.id] = false;
    });
  }

  $("#caseButtons").append(cases.map((label, i) => {
    return $("<button>", {type:"button", "class":"case-button", "data-case":i+1})
      .append($("<span>", {"class":"case-num",text:String(i+1).padStart(2,"0")}))
      .append($("<span>", {text:label}))[0];
  }));

  // Every case returns one jQuery chain selected from the current HTML page.
  // The array above is NOT used for finding answers.
  function selectCase(number) {
    switch(number) {
      case 1: return $(".room[data-room='hall'] .guest");
      case 2: return $(".guest[data-color='yellow'], .guest[data-color='purple']");
      case 3: return $(".room[data-floor='2'] .guest[data-aitu='true']");
      case 4: return $(".guest[data-glasses='true'], .guest[data-bag='true']");
      case 5: return $(".guest[data-phone='false'][data-glasses='false'][data-bag='false'][data-cup='false'][data-crumbs='false']");
      case 6: return $(".guest[data-phone='true'][data-bag='false']");
      case 7: return $(".guest[data-time]").filter(function(){return $(this).attr("data-time") >= "20:30" && $(this).attr("data-time") <= "21:00";});
      case 8: return $(".guest[data-aitu='false']").filter(function(){return $(this).attr("data-time") > "21:00";});
      case 9: return $(".guest[data-name='Askar']").siblings(".guest").filter(function(){return $(this).next().is("[data-name='Askar']") || $(this).prev().is("[data-name='Askar']");});
      case 10: return $(".room-guests .guest:last-child");
      case 11: return $(".room-guests .guest:nth-child(3)");
      case 12: return $(".guest[data-name='Timur']").nextAll(".guest");
      case 13: return $(".guest[data-color='black']").prev(".guest");
      case 14: return $(".guest[data-name='Aruzhan']").closest(".room");
      case 15: return $(".room").filter(function(){return $(this).find(".guest").length < 6;});
      case 16: return $(".room:has(.guest[data-cup='true']):not(:has(.guest[data-glasses='true']))");
      case 17: return $(".room-guests .guest").filter(function(){const t=$(this).attr("data-time");return $(this).siblings(".guest").filter(function(){return $(this).attr("data-time") < t;}).length === 0;});
      case 18: return $(".guest[data-name='Askar']").after(makeGuest({name:"Miras",color:"blue",time:"21:20",aitu:true,things:["phone"]},3).hide()).next(".guest").fadeIn(450);
      case 19: return $(".guest[data-name='Natasha']").fadeOut(450,function(){$(this).remove();});
      case 20: return $(".room[data-floor='1'] .guest[data-crumbs='true'][data-cup='false']").filter(function(){
        const t=$(this).attr("data-time");
        return t>"21:00" && t<"21:30" && ( $(this).prev(".guest[data-aitu='true']").length>0 || $(this).next(".guest[data-aitu='true']").length>0 );
      });
      default: return $();
    }
  }

  function updateResults(number, $found) {
    const isRoom = $found.first().hasClass("room");
    const names = $found.map(function(){ return isRoom ? $(this).find("h3").clone().children().remove().end().text() : $(this).attr("data-name"); }).get();
    $("#resultTitle").text("Case " + number + ": " + cases[number-1]);
    $("#resultText").text(names.length ? names.join(", ") : "No matches found.");
    $("#resultCount").text(names.length + (isRoom ? (names.length === 1 ? " room" : " rooms") : (names.length === 1 ? " guest" : " guests")));
  }

  function spotlight($found) {
    const isRoom = $found.first().hasClass("room");
    const $bright = isRoom ? $found.find(".guest") : $found;
    const $dim = $(".guest").not($bright);
    $(".guest").stop(true,true).css("opacity",1);
    $dim.stop(true,true).fadeTo(300,0.2);
    $bright.stop(true,true).fadeTo(300,1);
  }

  function jumpOnce($found) {
    const $guests = $found.first().hasClass("room") ? $found.find(".guest") : $found;
    $guests.each(function(){
      $(this).stop(true,true).css("top",0).animate({top:-10},145).animate({top:0},175);
    });
  }

  function resetHighlights(animated) {
    $(".guest").removeClass("selected aitu-selected").stop(true,true).css("top",0);
    if(animated) $(".guest").fadeTo(300,1);
    else $(".guest").css("opacity",1);
  }

  function runCase(number) {
    if(moving) return;
    forceCloseModal();
    renderHouse(); // Build again before every case, including cases 18 and 19.
    $(".case-button").removeClass("active");
    $(".case-button[data-case='"+number+"']").addClass("active");
    const $found = selectCase(number);
    updateResults(number,$found);
    const $guests = $found.first().hasClass("room") ? $found.find(".guest") : $found;
    $guests.addClass("selected");
    if(number===20) $guests.addClass("aitu-selected");
    if(motionMode) spotlight($found);
    jumpOnce($found);
  }

  $("#caseButtons").on("click", ".case-button", function(){runCase(Number($(this).attr("data-case")));});
  $("#clearButton").on("click", function(){
    if(moving) return;
    $(".case-button").removeClass("active");
    resetHighlights(motionMode);
    $("#resultTitle").text("Choose a case to begin");
    $("#resultText").text("All guests are at the party.");
    $("#resultCount").text($(".guest").length + " guests");
  });

  function locateGuest(name){
    for(let i=0;i<party.length;i++) {
      const at=party[i].guests.findIndex(g=>g.name===name);
      if(at>=0) return {roomIndex:i, guestIndex:at, guest:party[i].guests[at]};
    }
    return null;
  }

  function forceCloseModal(){
    modalOpen=false;
    $("#guestModal").stop(true,true).hide();
    $("#modalOverlay").stop(true,true).hide();
  }

  function modalDestination(){
    const w=Math.min(350,window.innerWidth-30),h=420;
    return {left:Math.round((window.innerWidth-w)/2),top:Math.max(15,Math.round((window.innerHeight-h)/2)),width:w,height:h};
  }
  function openGuestModal($guest){
    if(moving) return;
    forceCloseModal();
    const name=$guest.attr("data-name");
    const found=locateGuest(name);
    if(!found) return;
    const g=found.guest;
    modalGuest=name;
    const r=$guest.find(".avatar-wrap")[0].getBoundingClientRect();
    modalAvatarRect={left:r.left,top:r.top,width:r.width,height:r.height};
    const thingsText=g.things.length ? g.things.map(t=>itemNames[t]).join(", ") : "Nothing";
    const $modal=$("#guestModal").empty().css("--guest-color",colorCodes[g.color]);
    $modal.append($("<button>",{type:"button","class":"modal-close","aria-label":"Close card",text:"×"}));
    $modal.append($("<img>",{ "class":"modal-portrait", src:avatarUrl(g.name),alt:g.name}));
    $modal.append($("<div>",{"class":"modal-title",text:g.name}));
    $modal.append($("<div>",{"class":"modal-subtitle",text:g.aitu?"AITU student":"Party guest"}));
    const $info=$("<div>",{"class":"modal-info"});
    $info.append($("<div>").text("◷ Came at " + g.time));
    $info.append($("<div>").text("● Wearing " + g.color));
    $info.append($("<div>").text(g.aitu ? "✓ AITU student" : "− Not an AITU student"));
    $info.append($("<div>").text("▣ Has: " + thingsText));
    $info.append($("<div>").text("⌂ Room: " + party[found.roomIndex].name));
    $modal.append($info);
    $modal.append($("<div>",{"class":"move-label",text:"MOVE GUEST TO"}));
    party.filter((_,i)=>i!==found.roomIndex).forEach(room=>{
      $modal.append($("<button>",{type:"button","class":"move-btn",text:room.name,"data-target":room.id}));
    });
    $("#modalOverlay").stop(true,true).fadeIn(130);
    $modal.stop(true,true).css({...modalAvatarRect,opacity:0.25,display:"block"})
      .animate({...modalDestination(),opacity:1},340);
    modalOpen=true;
  }

  function closeModal(){
    if(!modalOpen) return;
    modalOpen=false;
    $("#modalOverlay").stop(true,true).fadeOut(230);
    $("#guestModal").stop(true,true).animate({...modalAvatarRect,opacity:0.2},260,function(){$(this).hide();});
  }
  // Clicks outside the card close it; another guest can be opened directly.
  $(document).on("click",function(e){if(modalOpen && !$(e.target).closest("#guestModal, .guest").length) closeModal();});
  $("#guestModal").on("click",".modal-close",closeModal);
  $(document).on("keydown",function(e){if(e.key==="Escape") closeModal();});
  $("#floor1, #floor2").on("click", ".guest", function(){ if(motionMode) openGuestModal($(this)); });
  $("#floor1, #floor2").on("keydown", ".guest", function(e){if(motionMode && (e.key==="Enter"||e.key===" ")) {e.preventDefault();openGuestModal($(this));}});

  function moveGuest(name, targetId){
    if(moving) return;
    const found=locateGuest(name);
    if(!found) return;
    const from=party[found.roomIndex];
    const to=party.find(r=>r.id===targetId);
    if(!to || from===to) return;
    const $actual=$(".guest[data-name='"+name+"']");
    if(!$actual.length) return;
    forceCloseModal();
    moving=true;
    const start=$actual[0].getBoundingClientRect();
    const $destination=$(".room[data-room='"+targetId+"'] .room-guests");
    const $placeholder=$("<div>",{"class":"guest-placeholder"}).css({width:0,height:start.height,flex:"0 0 0"}).appendTo($destination);
    const d=$placeholder[0].getBoundingClientRect();
    const end={left:d.left,top:d.top};
    // The flying copy stays visible while the old slot closes and a new slot opens.
    const $fly=$actual.clone().addClass("fly-card").css({left:start.left,top:start.top,width:start.width,height:start.height,margin:0,opacity:1,flex:"none"}).appendTo("body");
    $actual.stop(true,true).animate({width:0,paddingLeft:0,paddingRight:0,opacity:0},560);
    $placeholder.stop(true,true).animate({width:start.width,opacity:0.45},560);
    $fly.stop(true,true).animate({...end,width:start.width,height:start.height},580,function(){
      $fly.remove();
      $actual.stop(true,true).remove();
      $placeholder.replaceWith(makeGuest(found.guest,to.guests.length));
      from.guests.splice(found.guestIndex,1);
      to.guests.push(found.guest); // Update the array used to build the house.
      moving=false;
      resetHighlights(true);
      $(".case-button").removeClass("active");
      $("#resultTitle").text(name + " moved to the " + to.name.toLowerCase());
      $("#resultText").text("The party array and the page now have the new room.");
      $("#resultCount").text($(".guest").length+" guests");
    });
  }
  $("#guestModal").on("click", ".move-btn",function(){moveGuest(modalGuest,$(this).attr("data-target"));});

  function sortRoom(roomId){
    if(moving) return;
    const $container=$(".room[data-room='"+roomId+"'] .room-guests");
    const $cards=$container.children(".guest");
    if($cards.length<2) return;
    // Save current visible coordinates, even if an earlier animation is running.
    $cards.stop(true,false);
    const before={};
    $cards.each(function(){before[$(this).attr("data-name")]=this.getBoundingClientRect();});
    sortState[roomId]=!sortState[roomId];
    const ordered=$cards.get().sort((a,b)=>{
      return sortState[roomId]
        ? $(a).attr("data-time").localeCompare($(b).attr("data-time"))
        : Number($(a).attr("data-order"))-Number($(b).attr("data-order"));
    });
    // Reposition nodes, then animate each card from its former screen position.
    $(ordered).css({left:0,top:0}).detach().appendTo($container);
    $(ordered).each(function(){
      const previous=before[$(this).attr("data-name")];
      const next=this.getBoundingClientRect();
      $(this).css({left:previous.left-next.left, top:previous.top-next.top})
        .stop(true,false).animate({left:0,top:0},620);
    });
  }
  $("#floor1, #floor2").on("click", ".sort-btn",function(){if(motionMode)sortRoom($(this).attr("data-room"));});

  renderHouse();
  // Expose a tiny test helper for the browser-based check, not used for selecting cases.
  window.assignment6 = {selectCase, runCase, party, locateGuest, sortRoom};
});
