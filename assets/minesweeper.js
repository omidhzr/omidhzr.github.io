// Minesweeper - a from-scratch tribute to the Windows XP classic.
// All art is drawn pixel by pixel on a canvas using the original layout
// (16px cells, 3D bevels, 7-segment counters, smiley button).
(function () {
	const LEVELS = {
		beginner: { cols: 9, rows: 9, mines: 10, label: "Beginner" },
		intermediate: { cols: 16, rows: 16, mines: 40, label: "Intermediate" },
		expert: { cols: 30, rows: 16, mines: 99, label: "Expert" },
	};

	const C = {
		face: "#c0c0c0",
		light: "#ffffff",
		dark: "#808080",
		black: "#000000",
		red: "#ff0000",
		yellow: "#ffff00",
		segOn: "#ff0000",
		segOff: "#2e0000",
	};

	const NUMBER_COLORS = [null, "#0000ff", "#008000", "#ff0000", "#000080", "#800000", "#008080", "#000000", "#808080"];

	// 8x11 glyphs for the cell numbers
	const NUMBERS = [
		null,
		["...##...", "..###...", ".####...", "...##...", "...##...", "...##...", "...##...", "...##...", "...##...", ".######.", ".######."],
		[".######.", "##....##", "......##", "......##", ".....##.", "...###..", "..##....", ".##.....", "##......", "########", "########"],
		[".######.", "##....##", "......##", "......##", "...####.", "...####.", "......##", "......##", "......##", "##....##", ".######."],
		["....###.", "...####.", "..##.##.", ".##..##.", "##...##.", "########", "########", ".....##.", ".....##.", ".....##.", ".....##."],
		["########", "########", "##......", "##......", "#######.", "......##", "......##", "......##", "......##", "##....##", ".######."],
		[".######.", "##....##", "##......", "##......", "#######.", "##....##", "##....##", "##....##", "##....##", "##....##", ".######."],
		["########", "########", "......##", "......##", ".....##.", ".....##.", "....##..", "....##..", "...##...", "...##...", "...##..."],
		[".######.", "##....##", "##....##", "##....##", ".######.", ".######.", "##....##", "##....##", "##....##", "##....##", ".######."],
	];

	const QUESTION = ["..####..", ".##..##.", "##....##", "......##", ".....##.", "....##..", "...##...", "...##...", "........", "...##...", "...##..."];

	// 13x13 mine, w = white highlight
	const MINE = [
		"......#......",
		"......#......",
		"..#.#####.#..",
		"...#######...",
		"..##ww#####..",
		"..##ww#####..",
		"#############",
		"..#########..",
		"..#########..",
		"...#######...",
		"..#.#####.#..",
		"......#......",
		"......#......",
	];

	// 8x10 flag, r = red cloth, # = pole and base
	const FLAG = ["...rr...", ".rrrr...", "rrrrr...", ".rrrr...", "...rr...", "....#...", "....#...", "..####..", "########", "########"];

	// ---------- pixel helpers ----------
	function sprite(w, h, draw) {
		const c = document.createElement("canvas");
		c.width = w;
		c.height = h;
		draw(c.getContext("2d"));
		return c;
	}

	function rect(g, x, y, w, h, color) {
		g.fillStyle = color;
		g.fillRect(x, y, w, h);
	}

	function glyph(g, rows, x0, y0, colors) {
		rows.forEach((row, y) => {
			for (let x = 0; x < row.length; x++) {
				const color = colors[row[x]];
				if (color) rect(g, x0 + x, y0 + y, 1, 1, color);
			}
		});
	}

	function bevel(g, x, y, w, h, t, topLeft, bottomRight) {
		for (let i = 0; i < t; i++) {
			rect(g, x, y + i, w - 1 - i, 1, topLeft);
			rect(g, x + i, y, 1, h - 1 - i, topLeft);
			rect(g, x + 1 + i, y + h - 1 - i, w - 1 - i, 1, bottomRight);
			rect(g, x + w - 1 - i, y + 1 + i, 1, h - 1 - i, bottomRight);
		}
	}
	const raised = (g, x, y, w, h, t) => bevel(g, x, y, w, h, t, C.light, C.dark);
	const sunken = (g, x, y, w, h, t) => bevel(g, x, y, w, h, t, C.dark, C.light);

	// ---------- cell sprites (16x16) ----------
	function openCell(g) {
		rect(g, 0, 0, 16, 16, C.face);
		rect(g, 0, 0, 16, 1, C.dark);
		rect(g, 0, 0, 1, 16, C.dark);
	}
	function closedCell(g) {
		rect(g, 0, 0, 16, 16, C.face);
		raised(g, 0, 0, 16, 16, 2);
	}
	const mine = (g) => glyph(g, MINE, 2, 2, { "#": C.black, w: C.light });

	const CELL = {
		closed: sprite(16, 16, closedCell),
		open: sprite(16, 16, openCell),
		flag: sprite(16, 16, (g) => {
			closedCell(g);
			glyph(g, FLAG, 3, 3, { r: C.red, "#": C.black });
		}),
		question: sprite(16, 16, (g) => {
			closedCell(g);
			glyph(g, QUESTION, 4, 3, { "#": C.black });
		}),
		questionPressed: sprite(16, 16, (g) => {
			openCell(g);
			glyph(g, QUESTION, 4, 3, { "#": C.black });
		}),
		mine: sprite(16, 16, (g) => {
			openCell(g);
			mine(g);
		}),
		exploded: sprite(16, 16, (g) => {
			openCell(g);
			rect(g, 1, 1, 15, 15, C.red);
			mine(g);
		}),
		wrongFlag: sprite(16, 16, (g) => {
			openCell(g);
			mine(g);
			for (let i = 0; i < 10; i++) {
				rect(g, 3 + i, 3 + i, 2, 1, C.red);
				rect(g, 12 - i, 3 + i, 2, 1, C.red);
			}
		}),
		numbers: NUMBERS.map((rows, n) =>
			rows
				? sprite(16, 16, (g) => {
						openCell(g);
						glyph(g, rows, 4, 3, { "#": NUMBER_COLORS[n] });
				  })
				: null
		),
	};

	// ---------- 7-segment digits (13x23) ----------
	const SEGMENTS = {
		a: [[1, 2, 10], [2, 3, 9], [3, 4, 8]].map(([y, x1, x2]) => ({ y, x1, x2 })),
		d: [[21, 2, 10], [20, 3, 9], [19, 4, 8]].map(([y, x1, x2]) => ({ y, x1, x2 })),
		g: [[10, 3, 9], [11, 2, 10], [12, 3, 9]].map(([y, x1, x2]) => ({ y, x1, x2 })),
		f: [[1, 2, 10], [2, 3, 9], [3, 4, 8]].map(([x, y1, y2]) => ({ x, y1, y2 })),
		b: [[11, 2, 10], [10, 3, 9], [9, 4, 8]].map(([x, y1, y2]) => ({ x, y1, y2 })),
		e: [[1, 12, 20], [2, 13, 19], [3, 14, 18]].map(([x, y1, y2]) => ({ x, y1, y2 })),
		c: [[11, 12, 20], [10, 13, 19], [9, 14, 18]].map(([x, y1, y2]) => ({ x, y1, y2 })),
	};
	const DIGIT_SEGMENTS = {
		0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc",
		5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g",
	};
	const DIGITS = {};
	Object.keys(DIGIT_SEGMENTS).forEach((key) => {
		DIGITS[key] = sprite(13, 23, (g) => {
			rect(g, 0, 0, 13, 23, C.black);
			Object.entries(SEGMENTS).forEach(([name, lines]) => {
				const color = DIGIT_SEGMENTS[key].includes(name) ? C.segOn : C.segOff;
				lines.forEach((l) => {
					if (l.y !== undefined) rect(g, l.x1, l.y, l.x2 - l.x1 + 1, 1, color);
					else rect(g, l.x, l.y1, 1, l.y2 - l.y1 + 1, color);
				});
			});
		});
	});

	// ---------- smiley button (26x26) ----------
	const FEATURES = {
		smile: {
			eyes: [[10, 10], [11, 10], [10, 11], [11, 11], [14, 10], [15, 10], [14, 11], [15, 11]],
			mouth: [[9, 15], [16, 15], [10, 16], [15, 16], [11, 17], [12, 17], [13, 17], [14, 17]],
		},
		oh: {
			eyes: [[10, 10], [11, 10], [10, 11], [11, 11], [14, 10], [15, 10], [14, 11], [15, 11]],
			mouth: [[12, 15], [13, 15], [11, 16], [14, 16], [11, 17], [14, 17], [12, 18], [13, 18]],
		},
		dead: {
			eyes: [[9, 9], [11, 9], [10, 10], [9, 11], [11, 11], [14, 9], [16, 9], [15, 10], [14, 11], [16, 11]],
			mouth: [[11, 15], [12, 15], [13, 15], [14, 15], [10, 16], [15, 16], [9, 17], [16, 17]],
		},
		cool: {
			eyes: [
				[5, 9], [20, 9], [6, 10], [7, 10], [18, 10], [19, 10], [12, 10], [13, 10],
				[8, 10], [9, 10], [10, 10], [11, 10], [14, 10], [15, 10], [16, 10], [17, 10],
				[8, 11], [9, 11], [10, 11], [11, 11], [14, 11], [15, 11], [16, 11], [17, 11],
				[9, 12], [10, 12], [15, 12], [16, 12],
			],
			mouth: [[9, 15], [16, 15], [10, 16], [15, 16], [11, 17], [12, 17], [13, 17], [14, 17]],
		},
	};

	function faceSprite(kind, pressed) {
		return sprite(26, 26, (g) => {
			rect(g, 0, 0, 26, 26, C.face);
			rect(g, 0, 0, 26, 1, C.dark);
			rect(g, 0, 0, 1, 26, C.dark);
			rect(g, 0, 25, 26, 1, C.dark);
			rect(g, 25, 0, 1, 26, C.dark);
			if (pressed) {
				rect(g, 1, 1, 24, 1, C.dark);
				rect(g, 1, 1, 1, 24, C.dark);
			} else {
				raised(g, 1, 1, 24, 24, 2);
			}
			const o = pressed ? 1 : 0;
			for (let y = 0; y < 26; y++) {
				for (let x = 0; x < 26; x++) {
					const d = Math.hypot(x + 0.5 - 13, y + 0.5 - 13);
					if (d <= 8.5) rect(g, x + o, y + o, 1, 1, d > 7.4 ? C.black : C.yellow);
				}
			}
			const f = FEATURES[kind];
			[...f.eyes, ...f.mouth].forEach(([x, y]) => rect(g, x + o, y + o, 1, 1, C.black));
		});
	}
	const FACES = {
		smile: faceSprite("smile", false),
		pressed: faceSprite("smile", true),
		oh: faceSprite("oh", false),
		dead: faceSprite("dead", false),
		cool: faceSprite("cool", false),
	};

	// ---------- storage (per-viewer conveniences only) ----------
	const store = {
		get(key, fallback) {
			try {
				const v = localStorage.getItem("minesweeper." + key);
				return v === null ? fallback : JSON.parse(v);
			} catch (e) {
				return fallback;
			}
		},
		set(key, value) {
			try {
				localStorage.setItem("minesweeper." + key, JSON.stringify(value));
			} catch (e) {}
		},
	};
	const defaultBest = () => ({
		beginner: { time: 999, name: "Anonymous" },
		intermediate: { time: 999, name: "Anonymous" },
		expert: { time: 999, name: "Anonymous" },
	});

	// ---------- DOM ----------
	const win = document.querySelector(".mine-window");
	const tab = document.querySelector(".mine-tab");
	const canvas = win.querySelector(".mine-canvas");
	const ctx = canvas.getContext("2d");
	const dialogLayer = win.querySelector(".mine-dialog-layer");

	// ---------- game state ----------
	let level = LEVELS[store.get("level", "beginner")] ? store.get("level", "beginner") : "beginner";
	let marksEnabled = store.get("marks", true);
	let best = Object.assign(defaultBest(), store.get("best", {}));
	let cols, rows, mineCount, W, H;
	let isMine, isOpen, mark, adjacent; // mark: 0 none, 1 flag, 2 question
	let state, openedCount, flagCount, time, explodedAt, timerId;
	let pressed = new Set();
	let face = "smile";

	const idx = (x, y) => y * cols + x;
	function neighbours(i) {
		const x = i % cols;
		const y = (i / cols) | 0;
		const out = [];
		for (let dy = -1; dy <= 1; dy++)
			for (let dx = -1; dx <= 1; dx++) {
				const nx = x + dx;
				const ny = y + dy;
				if ((dx || dy) && nx >= 0 && ny >= 0 && nx < cols && ny < rows) out.push(idx(nx, ny));
			}
		return out;
	}

	function newGame() {
		({ cols, rows, mines: mineCount } = LEVELS[level]);
		const n = cols * rows;
		isMine = new Uint8Array(n);
		isOpen = new Uint8Array(n);
		mark = new Uint8Array(n);
		adjacent = new Uint8Array(n);
		state = "ready";
		openedCount = 0;
		flagCount = 0;
		time = 0;
		explodedAt = -1;
		pressed.clear();
		face = "smile";
		clearInterval(timerId);
		W = 16 * cols + 20;
		H = 16 * rows + 63;
		if (canvas.width !== W || canvas.height !== H) {
			canvas.width = W;
			canvas.height = H;
			fitToScreen();
		}
		draw();
	}

	function placeMines(safe) {
		let placed = 0;
		while (placed < mineCount) {
			const i = (Math.random() * cols * rows) | 0;
			if (i !== safe && !isMine[i]) {
				isMine[i] = 1;
				placed++;
			}
		}
		for (let i = 0; i < isMine.length; i++) adjacent[i] = neighbours(i).filter((j) => isMine[j]).length;
	}

	function startTimer() {
		state = "playing";
		time = 1;
		timerId = setInterval(() => {
			// like XP, the clock stops while the window is minimized
			if (isVisible() && time < 999) {
				time++;
				draw();
			}
		}, 1000);
	}

	function reveal(i) {
		if (isOpen[i] || mark[i] === 1) return;
		if (state === "ready") {
			placeMines(i);
			startTimer();
		}
		if (isMine[i]) return lose(i);
		const stack = [i];
		while (stack.length) {
			const j = stack.pop();
			if (isOpen[j] || mark[j] === 1) continue;
			isOpen[j] = 1;
			mark[j] = 0;
			openedCount++;
			if (adjacent[j] === 0) neighbours(j).forEach((k) => !isOpen[k] && stack.push(k));
		}
		if (openedCount === cols * rows - mineCount) win_();
	}

	function chord(i) {
		if (!isOpen[i] || !adjacent[i]) return;
		const around = neighbours(i);
		if (around.filter((j) => mark[j] === 1).length !== adjacent[i]) return;
		around.forEach((j) => state === "playing" && reveal(j));
	}

	function toggleMark(i) {
		if (isOpen[i]) return;
		if (mark[i] === 0) {
			mark[i] = 1;
			flagCount++;
		} else if (mark[i] === 1) {
			mark[i] = marksEnabled ? 2 : 0;
			flagCount--;
		} else {
			mark[i] = 0;
		}
	}

	function lose(i) {
		state = "lost";
		explodedAt = i;
		face = "dead";
		clearInterval(timerId);
	}

	function win_() {
		state = "won";
		face = "cool";
		clearInterval(timerId);
		for (let i = 0; i < isMine.length; i++) if (isMine[i]) mark[i] = 1;
		flagCount = mineCount;
		if (time < best[level].time) setTimeout(() => askName(), 50);
	}

	// ---------- drawing ----------
	function drawCounter(x, y, value) {
		rect(ctx, x, y, 41, 1, C.dark);
		rect(ctx, x, y, 1, 25, C.dark);
		rect(ctx, x, y + 24, 41, 1, C.light);
		rect(ctx, x + 40, y, 1, 25, C.light);
		const v = Math.max(-99, Math.min(999, value));
		const text = v < 0 ? "-" + String(-v).padStart(2, "0") : String(v).padStart(3, "0");
		[...text].forEach((ch, k) => ctx.drawImage(DIGITS[ch], x + 1 + 13 * k, y + 1));
	}

	function cellSprite(i) {
		if (state === "lost") {
			if (i === explodedAt) return CELL.exploded;
			if (isMine[i] && mark[i] !== 1) return CELL.mine;
			if (!isMine[i] && mark[i] === 1) return CELL.wrongFlag;
		}
		if (isOpen[i]) return adjacent[i] ? CELL.numbers[adjacent[i]] : CELL.open;
		if (mark[i] === 1) return CELL.flag;
		if (pressed.has(i)) return mark[i] === 2 ? CELL.questionPressed : CELL.open;
		if (mark[i] === 2) return CELL.question;
		return CELL.closed;
	}

	function draw() {
		rect(ctx, 0, 0, W, H, C.face);
		rect(ctx, 0, 0, W, 3, C.light);
		rect(ctx, 0, 0, 3, H, C.light);
		// header
		sunken(ctx, 9, 9, W - 15, 37, 2);
		drawCounter(16, 15, mineCount - flagCount);
		drawCounter(W - 54, 15, time);
		ctx.drawImage(FACES[face], Math.round((W + 3) / 2 - 13), 15);
		// board
		sunken(ctx, 9, 52, 16 * cols + 6, 16 * rows + 6, 3);
		for (let y = 0; y < rows; y++)
			for (let x = 0; x < cols; x++) ctx.drawImage(cellSprite(idx(x, y)), 12 + 16 * x, 55 + 16 * y);
	}

	function fitToScreen() {
		if (!W) return;
		const room = Math.min((window.innerWidth - 24) / W, (window.innerHeight - 32 - 70) / H);
		const k = room >= 2 ? 2 : room >= 1.5 ? 1.5 : room >= 1 ? 1 : room;
		canvas.style.width = W * k + "px";
		canvas.style.height = H * k + "px";
	}
	window.addEventListener("resize", fitToScreen);

	// ---------- input ----------
	function hit(e) {
		const r = canvas.getBoundingClientRect();
		const x = ((e.clientX - r.left) * W) / r.width;
		const y = ((e.clientY - r.top) * H) / r.height;
		const faceX = Math.round((W + 3) / 2 - 13);
		if (x >= faceX && x < faceX + 26 && y >= 15 && y < 41) return { face: true };
		const cx = Math.floor((x - 12) / 16);
		const cy = Math.floor((y - 55) / 16);
		if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) return { cell: idx(cx, cy) };
		return {};
	}

	const playable = () => state === "ready" || state === "playing";
	let left = false, right = false, middle = false, chording = false, chordDone = false, faceDown = false, hover = {};

	function updatePressed() {
		pressed.clear();
		if (!playable() || hover.cell === undefined) return;
		if (chording) [hover.cell, ...neighbours(hover.cell)].forEach((j) => !isOpen[j] && mark[j] !== 1 && pressed.add(j));
		else if (left && !isOpen[hover.cell] && mark[hover.cell] !== 1) pressed.add(hover.cell);
	}

	function refresh() {
		updatePressed();
		if (faceDown) face = hover.face ? "pressed" : endFace();
		else face = playable() && (left || chording) ? "oh" : endFace();
		draw();
	}
	const endFace = () => (state === "lost" ? "dead" : state === "won" ? "cool" : "smile");

	// mouse: mousedown fires for every button, which chording needs
	canvas.addEventListener("mousedown", (e) => {
		e.preventDefault();
		hover = hit(e);
		if (e.button === 0 && hover.face) faceDown = true;
		else if (playable() && hover.cell !== undefined) {
			if (e.button === 0) left = true;
			if (e.button === 1) middle = true;
			if (e.button === 2) {
				right = true;
				if (!left) toggleMark(hover.cell);
			}
			chording = middle || (left && right);
		}
		refresh();
	});

	canvas.addEventListener("mousemove", (e) => {
		if (!left && !right && !middle && !faceDown) return;
		hover = hit(e);
		refresh();
	});

	document.addEventListener("mouseup", (e) => {
		if (!left && !right && !middle && !faceDown) return;
		if (e.target === canvas) hover = hit(e);
		else hover = {};
		if (faceDown && e.button === 0) {
			faceDown = false;
			if (hover.face) newGame();
		} else if (chording && !chordDone) {
			if (hover.cell !== undefined) chord(hover.cell);
			chordDone = true;
		} else if (e.button === 0 && left && !chordDone && hover.cell !== undefined) {
			reveal(hover.cell);
		}
		if (e.button === 0) left = false;
		if (e.button === 1) middle = false;
		if (e.button === 2) right = false;
		if (!left && !right && !middle) chording = chordDone = false;
		refresh();
	});

	canvas.addEventListener("contextmenu", (e) => e.preventDefault());

	// touch and pen: tap reveals, long-press flags, tapping a number chords
	let touch = null;
	canvas.addEventListener("pointerdown", (e) => {
		if (e.pointerType === "mouse") return;
		e.preventDefault(); // also suppresses the emulated mouse events
		const h = hit(e);
		touch = { h, x: e.clientX, y: e.clientY, done: false };
		if (h.face) {
			faceDown = true;
			hover = h;
			return refresh();
		}
		if (!playable() || h.cell === undefined) return;
		hover = h;
		left = true;
		refresh();
		touch.timer = setTimeout(() => {
			touch.done = true;
			left = false;
			toggleMark(h.cell);
			if (navigator.vibrate) navigator.vibrate(25);
			refresh();
		}, 380);
	});

	canvas.addEventListener("pointermove", (e) => {
		if (!touch || e.pointerType === "mouse") return;
		if (Math.hypot(e.clientX - touch.x, e.clientY - touch.y) > 12) {
			clearTimeout(touch.timer);
			touch.done = true;
			left = faceDown = false;
			hover = {};
			refresh();
		}
	});

	function endTouch(e) {
		if (!touch || e.pointerType === "mouse") return;
		clearTimeout(touch.timer);
		const { h, done } = touch;
		touch = null;
		left = false;
		if (faceDown) {
			faceDown = false;
			if (!done) newGame();
		} else if (!done && playable() && h.cell !== undefined) {
			if (isOpen[h.cell]) chord(h.cell);
			else reveal(h.cell);
		}
		hover = {};
		refresh();
	}
	canvas.addEventListener("pointerup", endTouch);
	canvas.addEventListener("pointercancel", endTouch);

	document.addEventListener("keydown", (e) => {
		if (e.key === "F2" && isVisible()) {
			e.preventDefault();
			newGame();
		}
	});

	// ---------- menus ----------
	const menus = [...win.querySelectorAll(".mine-menu")];
	let openMenu = null;
	function setMenu(m) {
		menus.forEach((x) => x.classList.toggle("open", x === m));
		openMenu = m;
	}
	menus.forEach((m) => {
		m.addEventListener("mousedown", (e) => {
			if (e.target.closest(".mine-dropdown")) return;
			e.stopPropagation();
			setMenu(openMenu === m ? null : m);
		});
		m.addEventListener("mouseenter", () => openMenu && openMenu !== m && setMenu(m));
	});
	document.addEventListener("mousedown", (e) => {
		if (openMenu && !e.target.closest(".mine-menu")) setMenu(null);
	});

	function syncChecks() {
		win.querySelectorAll("[data-level]").forEach((el) => el.classList.toggle("checked", el.dataset.level === level));
		win.querySelector('[data-action="marks"]').classList.toggle("checked", marksEnabled);
	}

	win.querySelectorAll(".mine-dropdown [data-action], .mine-dropdown [data-level]").forEach((item) => {
		item.addEventListener("click", (e) => {
			e.stopPropagation();
			setMenu(null);
			const action = item.dataset.action;
			if (item.dataset.level) {
				level = item.dataset.level;
				store.set("level", level);
				syncChecks();
				newGame();
			} else if (action === "new") newGame();
			else if (action === "marks") {
				marksEnabled = !marksEnabled;
				store.set("marks", marksEnabled);
				syncChecks();
			} else if (action === "best") showBestTimes();
			else if (action === "exit") closeMinesweeper();
			else if (action === "about") showAbout();
		});
	});

	// ---------- dialogs ----------
	function dialog(title, body, buttons) {
		dialogLayer.innerHTML = "";
		const d = document.createElement("div");
		d.className = "xp-dialog";
		d.innerHTML = `<div class="title-bar xp-dialog-title"><span></span><button class="cls xp-dialog-x" aria-label="Close"></button></div>
			<div class="xp-dialog-body"></div><div class="xp-dialog-buttons"></div>`;
		d.querySelector(".xp-dialog-title span").textContent = title;
		d.querySelector(".xp-dialog-body").append(body);
		const bar = d.querySelector(".xp-dialog-buttons");
		const close = () => (dialogLayer.innerHTML = "", dialogLayer.classList.remove("active"));
		buttons.forEach(([label, fn], k) => {
			const b = document.createElement("button");
			b.className = "xp-button";
			b.textContent = label;
			b.onclick = () => (fn && fn() === false ? null : close());
			bar.append(b);
			if (k === 0) setTimeout(() => b.focus(), 0);
		});
		d.querySelector(".xp-dialog-x").onclick = close;
		d.addEventListener("keydown", (e) => {
			if (e.key === "Escape") close();
			if (e.key === "Enter" && e.target.tagName === "INPUT") bar.querySelector("button").click();
		});
		dialogLayer.append(d);
		dialogLayer.classList.add("active");
		return d;
	}

	function showBestTimes() {
		const body = document.createElement("div");
		const table = document.createElement("table");
		table.className = "mine-best";
		const render = () => {
			table.innerHTML = "";
			Object.keys(LEVELS).forEach((key) => {
				const tr = table.insertRow();
				tr.insertCell().textContent = LEVELS[key].label + ":";
				tr.insertCell().textContent = best[key].time + " seconds";
				tr.insertCell().textContent = best[key].name;
			});
		};
		render();
		body.append(table);
		dialog("Fastest Mine Sweepers", body, [
			["OK"],
			[
				"Reset Scores",
				() => {
					best = defaultBest();
					store.set("best", best);
					render();
					return false;
				},
			],
		]);
	}

	function askName() {
		const body = document.createElement("div");
		body.className = "mine-name";
		const p = document.createElement("p");
		p.textContent = `You have the fastest time for ${LEVELS[level].label.toLowerCase()} level. Please type your name:`;
		const input = document.createElement("input");
		input.maxLength = 32;
		input.value = best[level].name === "Anonymous" ? "" : best[level].name;
		body.append(p, input);
		const d = dialog("Congratulations", body, [
			[
				"OK",
				() => {
					best[level] = { time, name: input.value.trim() || "Anonymous" };
					store.set("best", best);
					setTimeout(showBestTimes, 0);
				},
			],
		]);
		setTimeout(() => (input.focus(), input.select()), 0);
		return d;
	}

	function showAbout() {
		const body = document.createElement("div");
		body.className = "mine-about";
		body.innerHTML = `<img src="assets/minesweeper.svg" alt="">
			<div><b>Minesweeper</b><br>A tribute to the Windows XP classic,<br>recreated from scratch by Omid Hazara.
			<p>Left-click to reveal, right-click to flag.<br>Click a number with both buttons (or the middle button) to clear around it.<br>On touch screens: tap to reveal, long-press to flag.</p>
			<small>Windows and Minesweeper are trademarks of Microsoft Corporation.</small></div>`;
		dialog("About Minesweeper", body, [["OK"]]);
	}

	// ---------- window ----------
	function isVisible() {
		return win.style.display === "block" && !win.classList.contains("minimized");
	}

	window.openMinesweeper = function () {
		win.style.display = "block";
		win.classList.remove("minimized");
		tab.style.display = "block";
		tab.classList.add("active");
		focusWindow(win);
		fitToScreen();
	};

	function closeMinesweeper() {
		win.style.display = "none";
		tab.style.display = "none";
		tab.classList.remove("active");
		dialogLayer.innerHTML = "";
		dialogLayer.classList.remove("active");
		newGame();
	}

	win.querySelector(".cls").onclick = closeMinesweeper;
	win.querySelector(".min").onclick = () => {
		win.classList.add("minimized");
		tab.classList.remove("active");
	};
	tab.onclick = () => {
		if (isVisible()) {
			win.classList.add("minimized");
			tab.classList.remove("active");
		} else window.openMinesweeper();
	};
	document.querySelector(".minesweeper").ondblclick = function () {
		setTimeout(() => this.classList.remove("selected"), 2);
		window.openMinesweeper();
	};

	syncChecks();
	newGame();
})();
