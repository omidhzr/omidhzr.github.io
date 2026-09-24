// Globals used with the global start menu hider
// to make sure it doesn't hide in the two special
// cases:
// 1) Start menu itself clicked
// 2) Start menu button clicked (This also hides it,
//    but does some special things for the button as
//    well)
var isStartMenuClicked = false;
var isStartMenuButtonClicked = false;

function handleClick() {
	var startMenu = getElement("startmenu");
	if (
		startMenu.style.display == "block" &&
		!isStartMenuClicked &&
		!isStartMenuButtonClicked
	) {
		doStartMenu();
		doStartMenuButtonOut();
	}
	isStartMenuClicked = false;
	isStartMenuButtonClicked = false;
}

function registerStartMenuObjects() {
	var startMenuButton = getElement("startbutton");
	var startMenu = getElement("startmenu");

	// Events for when the mouse button is clicked and hovered
	startMenuButton.onclick = doStartMenu;
	startMenuButton.onmouseover = doStartMenuButtonOver;
	startMenuButton.onmouseout = doStartMenuButtonOut;

	// When you click the start menu itself, don't close it
	startMenu.onclick = startMenuClicked;

	// When you click anywhere in the document, and the menu is
	// showing, we want to hide it.
	document.childNodes[1].onclick = handleClick;
}

function startMenuClicked() {
	isStartMenuClicked = true;
}

function doStartMenu() {
	isStartMenuButtonClicked = true;
	var startMenuButton = getElement("startbutton");
	var startMenuButtonSpan = getElement("startbuttongraphic");
	var startMenu = getElement("startmenu");

	if (startMenu.style.display == "" || startMenu.style.display == "none") {
		startMenu.style.display = "block";
		startMenuButtonSpan.className = "startclicked";
	} else {
		startMenu.style.display = "none";
		startMenuButtonSpan.className = "starthovered";
	}
}

function doStartMenuButtonOver() {
	var startMenuButton = getElement("startbutton");
	var startMenuButtonSpan = getElement("startbuttongraphic");
	var startMenu = getElement("startmenu");

	if (startMenu.style.display == "" || startMenu.style.display == "none") {
		startMenuButtonSpan.className = "starthovered";
	}
}

function doStartMenuButtonOut() {
	var startMenuButton = getElement("startbutton");
	var startMenuButtonSpan = getElement("startbuttongraphic");
	var startMenu = getElement("startmenu");

	if (startMenu.style.display == "" || startMenu.style.display == "none") {
		startMenuButtonSpan.className = "startnormal";
	}
}
