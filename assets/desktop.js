// Helper function for startmenu.js compatibility
function getElement(id) {
	return document.getElementById(id);
}

// Initialize and update the clock
const updateClock = () => {
	const time = document.querySelector(".time");
	const now = new Date();

	// Update the time display
	time.innerHTML = new Intl.DateTimeFormat("en", {
		hour: "numeric",
		minute: "numeric",
		hour12: true,
	}).format(now);

	// Update the tooltip with full date
	time.setAttribute(
		"title",
		new Intl.DateTimeFormat("en", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			hour12: true,
		}).format(now)
	);

	// Calculate milliseconds until the next minute
	const nextMinute = new Date(now);
	nextMinute.setMinutes(now.getMinutes() + 1);
	nextMinute.setSeconds(0);
	nextMinute.setMilliseconds(0);
	const delay = nextMinute - now;

	// Schedule next update at the start of the next minute
	setTimeout(() => {
		updateClock();
		// Start regular interval once synchronized
		setInterval(updateClock, 60000);
	}, delay);
};

// Start the clock
updateClock();

document.querySelector(".desktop").onclick = function () {
	document.querySelectorAll(".icon").forEach((e) => {
		e.classList.remove("selected");
	});
};

document.querySelectorAll(".icon").forEach((icon) => {
	icon.onclick = function () {
		setTimeout(() => {
			document.querySelectorAll(".icon").forEach((e) => {
				e.classList.remove("selected");
			});
			this.classList.add("selected");
		}, 1);
	};
});

document.querySelector(".max").onclick = function () {
	document.querySelector(".window").classList.toggle("maximized");
};

document.querySelector(".min").onclick = function () {
	document.querySelector(".readme").classList.toggle("active");
	document.querySelector(".window").classList.toggle("minimized");
};

document.querySelector(".readme").onclick = function () {
	document.querySelector(".readme").classList.toggle("active");
	document.querySelector(".window").classList.toggle("minimized");
};

document.querySelector(".cls").onclick = function () {
	document.querySelector(".readme").style.display = "none";
	document.querySelector(".window").style.display = "none";
};

document.querySelector(".omid-hazara").ondblclick = function () {
	setTimeout(() => {
		this.classList.remove("selected");
	}, 2);
	window.open("https://omidhazara.github.io/");
};

document.querySelector(".my-computer").ondblclick = function () {
	setTimeout(() => {
		this.classList.remove("selected");
	}, 2);
	window.open("https://github.com/omidhzr/");
};

document.querySelector(".my-network").ondblclick = function () {
	setTimeout(() => {
		this.classList.remove("selected");
	}, 2);
	window.open("https://www.linkedin.com/in/omidhazara/");
};

document.querySelector(".note-pad").ondblclick = function () {
	setTimeout(() => {
		this.classList.remove("selected");
	}, 2);
	document.querySelector(".readme").style.display = "initial";
	document.querySelector(".window").style.display = "initial";
	document.querySelector(".window").style.opacity = "1";
	document.querySelector(".readme").classList.add("active");
	document.querySelector(".window").classList.remove("minimized");
};

document.querySelector("textarea").value =
	"Hello World!\n\nFeatures:\n- Desktop icons are clickable. Double clicking them takes you to some of my links (github, twitter, portfolio).\n- Time in system-tray is your system's time.\n- This window is draggable, closable, minimizable and maximizable. Try it.\n- The opened tabs in taskbar also take you to my links, same as the icons.\n______________________________\n\nThe code is on github. Star the repository if you liked this. Contributions to this repository are welcome and appreciated.\n______________________________\n\nDo follow me on github (@omidhzr). Open 'My Computer' and 'My Network' to go to these links.\n\nThis is a personal, non-commercial fan project. Windows XP is a trademark of Microsoft Corporation. All rights belong to their respective owners.\n\n";

dragWindow(document.querySelector(".window"));
function dragWindow(elmnt) {
	var pos1 = 0,
		pos2 = 0,
		pos3 = 0,
		pos4 = 0;

	document.querySelector(".title-bar").onmousedown = dragging;

	function dragging(e) {
		e = e || window.event;
		e.preventDefault();

		pos3 = e.clientX;
		pos4 = e.clientY;

		document.onmouseup = stopDragging;
		document.onmousemove = draggedWindow;
	}

	function draggedWindow(e) {
		e = e || window.event;
		e.preventDefault();

		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;

		elmnt.style.top = elmnt.offsetTop - pos2 + "px";
		elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
	}

	function stopDragging() {
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

// Shutdown functionality
function handleShutdown() {
	// Hide the start menu first
	doStartMenu();
	doStartMenuButtonOut();

	// Create a shutdown dialog
	const shutdownDialog = document.createElement("div");
	shutdownDialog.className = "shutdown-dialog";
	shutdownDialog.innerHTML = `
		<div class="shutdown-content">
			<div class="shutdown-header">Turn off computer</div>
			<div class="shutdown-message">What do you want the computer to do?</div>
			<div class="shutdown-options">
				<div class="shutdown-option" onclick="performShutdown()">
					<img src="assets/logo.svg" alt="shutdown">
					<span>Turn off</span>
				</div>
				<div class="shutdown-option" onclick="performRestart()">
					<img src="assets/logo.svg" alt="restart">
					<span>Restart</span>
				</div>
			</div>
			<div class="shutdown-buttons">
				<button onclick="cancelShutdown()">Cancel</button>
				<button onclick="performShutdown()">OK</button>
			</div>
		</div>
	`;

	document.body.appendChild(shutdownDialog);
}

function performShutdown() {
	// Play Windows shutdown sound
	const shutdownSound = new Audio("assets/windows-xp-shutdown.mp3");
	shutdownSound
		.play()
		.catch((e) => console.log("Could not play shutdown sound:", e));

	// Create shutdown screen
	document.body.innerHTML = `
		<div class="shutdown-screen">
			<div class="shutdown-text">Windows is shutting down...</div>
			<div class="shutdown-spinner"></div>
		</div>
	`;

	// After 3 seconds, show "safe to turn off" message
	setTimeout(() => {
		document.body.innerHTML = `
			<div class="shutdown-screen">
				<div class="shutdown-text">It's now safe to turn off your computer.</div>
			</div>
		`;
	}, 3000);
}

function performRestart() {
	// Create restart screen
	document.body.innerHTML = `
		<div class="shutdown-screen">
			<div class="shutdown-text">Windows is restarting...</div>
			<div class="shutdown-spinner"></div>
		</div>
	`;

	// After 3 seconds, reload the page
	setTimeout(() => {
		location.reload();
	}, 3000);
}

function cancelShutdown() {
	const dialog = document.querySelector(".shutdown-dialog");
	if (dialog) {
		dialog.remove();
	}
}

// Initialize start menu functionality
registerStartMenuObjects();
