var grid_size = 8;
var cell_size = 40;
var mines = 10;
var flags = mines;
var total_safe_cells = grid_size * grid_size - mines;
var cleared_cells = 0;
var clock;
var gameStarted = false;
var current_clock = 0;
var gamer_tag;
let game_history;
var grid_info = [];
const difficulties = {
  easy: { grid_size: 8, cell_size: 40, mines: 10 },
  medium: { grid_size: 16, cell_size: 30, mines: 40 },
  hard: { grid_size: 24, cell_size: 21, mines: 99 },
};
var current_difficulty = "easy";

//////////////////
// Display functions used to render elements
//////////////////
function createGrid() {
  console.log("Creating\n");
  const grid = document.getElementById("grid");
  grid.style.gridTemplateColumns = `repeat(${grid_size}, ${cell_size}px)`;
  grid.style.gridTemplateRows = `repeat(${grid_size}, ${cell_size}px)`;
  cleared_cells = 0; //resetting the number of cleared cells

  if (current_difficulty == "hard") {
    grid.style.gap = "2px";
  } else if (current_difficulty == "medium") {
    grid.style.gap = "4px";
  } else {
    grid.style.gap = "5px";
  }
  // Generate cells
  for (let i = 0; i < grid_size; i++) {
    grid_info.push([]);
    for (let j = 0; j < grid_size; j++) {
      const cell = document.createElement("div");

      //styling
      cell.classList.add("cell", "covered");
      cell.style.width = `${cell_size}px`;
      cell.style.height = `${cell_size}px`;

      //saving its info
      cell.dataset.row = i;
      cell.dataset.column = j;
      grid_info[i].push({ state: 0, safe: 1, number: 0 });
      //state: what the user has done with it (0: covered, 1: uncovered, 3: flagged)
      //Safe: weather the cell has a mine or not (1: safe, 0: contains mine)
      //number: number of adjacent mines
      cell.addEventListener("click", () => revealCell(cell));
      cell.addEventListener("contextmenu", (event) =>
        toggleFlagCell(event, cell)
      );
      grid.appendChild(cell);
    }
  }
  clearTimerData();
  placeMines();
  placeDistances();
  displayFlagCounter();
  clearWinLoseState();
  gameStarted = false;
}

function createDifficultyButtons() {
  button_conatiner = document.getElementById("diffRow");

  for (let difficulty in difficulties) {
    const button = document.createElement("div");
    button.classList.add("button");
    if (current_difficulty === difficulty) {
      button.classList.add("selected");
    }
    button.dataset.difficulty = String(difficulty);
    button.textContent =
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1); //just capitalized the first char
    button.addEventListener("click", () => changeDifficulty(difficulty));
    button_conatiner.appendChild(button);
  }
}
function displayFlagCounter() {
  const counter = document.getElementById("flag_counter");
  counter.textContent = flags;
}

///////////////
// Helper functions used in creating the grid
//////////////
function clearTimerData() {
  console.log(clearInterval(clock)); // stops time
  gameStarted = false;
  clock = undefined;
  gameStarted = false;
  current_clock = 0;

  document.getElementById("clock").innerHTML = "0:00";
}

function placeMines() {
  let mines_placed = 0;

  while (mines_placed < mines) {
    const random_i = Math.floor(Math.random() * grid_size);
    const random_j = Math.floor(Math.random() * grid_size);
    if (grid_info[random_i][random_j].safe != 0) {
      // ENSURES NO MINES OVERLAP
      grid_info[random_i][random_j].safe = 0;
      mines_placed++;
    }
  }
}

function placeDistances() {
  //function used to set the numbers you see on the grid
  for (let row = 0; row < grid_size; row++) {
    for (let column = 0; column < grid_size; column++) {
      if (grid_info[row][column].safe) {
        let adjacent_mines = 0;

        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const neighbor_row = row + i;
            const neighbor_col = column + j;

            // Check if the neighboring cell is within grid bounds and contains a mine
            if (
              neighbor_row >= 0 &&
              neighbor_row < grid_size &&
              neighbor_col >= 0 &&
              neighbor_col < grid_size &&
              !grid_info[neighbor_row][neighbor_col].safe &&
              grid_info[neighbor_row][neighbor_col].state === 0
            ) {
              adjacent_mines++;
            }
          }
        }
        grid_info[row][column].number = adjacent_mines;
      }
    }
  }
}

function getCell(row, column) {
  return document.querySelector(
    `.cell[data-row="${row}"][data-column="${column}"]`
  );
}

function revealCell(cell) {
  let row = parseInt(cell.dataset.row);
  let column = parseInt(cell.dataset.column);
  if (!gameStarted) {
    clock = setInterval(clockCounter, 10);
    gameStarted = true;
  }

  if (grid_info[row][column].state == 0) {
    //if covered
    cell.classList.remove("covered");
    cell.classList.add("uncovered");

    if (grid_info[row][column].safe) {
      grid_info[row][column].state = 1;
      cleared_cells++;
      if (cleared_cells == total_safe_cells) {
        //if user wins
        gameOver(1);
      }
      if (grid_info[row][column].number == 0) {
        //if no adjacent mines =>reveal neighboring cells
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const neighbor_row = row + i;
            const neighbor_col = column + j;

            if (
              neighbor_row >= 0 &&
              neighbor_row < grid_size &&
              neighbor_col >= 0 &&
              neighbor_col < grid_size &&
              grid_info[neighbor_row][neighbor_col].safe
            ) {
              const n_cell = getCell(neighbor_row, neighbor_col);
              revealCell(n_cell);
            }
          }
        }
      } else {
        cell.textContent = grid_info[row][column].number;
      }
    } else {
      cell.textContent = "💣";
      gameOver();
    }
  }
}

function revealGrid() {
  //used to reveal the whole grid once the user losses
  for (let row = 0; row < grid_size; row++) {
    for (let column = 0; column < grid_size; column++) {
      cell = getCell(parseInt(row), parseInt(column));

      if (grid_info[row][column].state != 1) {
        if (grid_info[row][column].state == 2) {
          //if flagged
          cell.textContent = "";
        }

        //if covered
        cell.classList.remove("covered");
        cell.classList.add("uncovered");
        grid_info[row][column].state = 1;

        if (grid_info[row][column].safe) {
          if (grid_info[row][column].number != 0) {
            cell.textContent = grid_info[row][column].number;
          }
        } else {
          cell.textContent = "💣";
        }
      }
    }
  }
}

function toggleFlagCell(event, cell) {
  event.preventDefault(); //prevents the default right click behaviour

  let i = cell.dataset.row;
  let j = cell.dataset.column;
  if (grid_info[i][j].state == 0) {
    if (flags == 0) return; // ~~~ Can't go under 0 flags
    grid_info[i][j].state = 3;
    cell.textContent = "🚩";
    flags--;
    displayFlagCounter();
  } else if (grid_info[i][j].state == 3) {
    grid_info[i][j].state = 0;
    cell.textContent = "";
    flags++;
    displayFlagCounter();
  }
}

function gameOver(win) {
  if (win) {
    console.log("Mabrouk");
    winScreen();
    revealGrid();
    saveGame();
  } else {
    console.log("Sorry");
    loseScreen();
    revealGrid();
  }

  console.log(clearInterval(clock)); // time
}

function changeGridSize(new_size, new_cell_size, new_mines) {
  grid.innerHTML = "";
  grid_size = new_size;
  mines = new_mines;
  flags = mines;
  cell_size = new_cell_size;
  total_safe_cells = grid_size * grid_size - mines;
  grid_info = [];
  //modifying the grid class
  createGrid();
}

function changeDifficulty(new_difficulty) {
  console.log(new_difficulty);
  current_difficulty = new_difficulty;
  if (new_difficulty === "easy") {
    changeGridSize(
      difficulties.easy.grid_size,
      difficulties.easy.cell_size,
      difficulties.easy.mines
    );
  } else if (new_difficulty === "medium") {
    changeGridSize(
      difficulties.medium.grid_size,
      difficulties.medium.cell_size,
      difficulties.medium.mines
    );
  } else {
    changeGridSize(
      difficulties.hard.grid_size,
      difficulties.hard.cell_size,
      difficulties.hard.mines
    );
  }
  button_conatiner.innerHTML = "";
  createDifficultyButtons();
}

function clockCounter() {
  ++current_clock;
  let seconds = Math.floor(current_clock / 100);
  let ms = current_clock % 100;

  document.getElementById("clock").innerHTML =
    seconds + ":" + (ms < 10 ? "0" + ms : ms);
}

function editGamerTag() {
  gamer_tag = prompt("Please enter your name:");
  document.getElementById("gamer_tag").innerHTML = gamer_tag;
}

function saveGame() {
  const game_data = {
    g_tag: gamer_tag,
    time: current_clock / 100,
    dif: current_difficulty,
  };

  game_history = JSON.parse(localStorage.getItem("game_history")) || {
    easy: [],
    medium: [],
    hard: [],
  };

  game_history[game_data.dif].push(game_data);

  game_history[game_data.dif].sort((a, b) => a.time - b.time);
  game_history[game_data.dif] = game_history[game_data.dif].slice(0, 3);

  localStorage.setItem("game_history", JSON.stringify(game_history));
  updateLeaderboards(current_difficulty);
}

function updateLeaderboards(dif) {
  game_history = JSON.parse(localStorage.getItem("game_history")) || {
    easy: [],
    medium: [],
    hard: [],
  };

  document.getElementById("leaderboard-easy").classList.remove("selected");
  document.getElementById("leaderboard-medium").classList.remove("selected");
  document.getElementById("leaderboard-hard").classList.remove("selected");

  document.getElementById("leaderboard-" + dif).classList.add("selected");

  const ranks = game_history[dif] || [];
  document.getElementById("rank1").innerHTML = ranks[0]
    ? `🏆 ${ranks[0].g_tag} - ${ranks[0].time}s`
    : "🏆 No score";
  document.getElementById("rank2").innerHTML = ranks[1]
    ? `🥈 ${ranks[1].g_tag} - ${ranks[1].time}s`
    : "🥈 No score";
  document.getElementById("rank3").innerHTML = ranks[2]
    ? `🥉 ${ranks[2].g_tag} - ${ranks[2].time}s`
    : "🥉 No score";
}

function playMusic() {
  window.addEventListener("load", () => {
    const music = document.getElementById("background-music");

    music
      .play()
      .then(() => {})
      .catch(() => {
        document.addEventListener(
          "click",
          () => {
            music.play();
          },
          { once: true }
        );
      });
  });
}

function winScreen() {
  document.body.classList.remove("red-bg");
  document.body.classList.add("green-bg");
  document.getElementById("end-game-text").innerHTML =
    "You Won, Check if you got a place in the leaderboard";
}

function loseScreen() {
  document.body.classList.remove("green-bg");
  document.body.classList.add("red-bg");
  document.getElementById("end-game-text").innerHTML = "Better Luck Next Time";
}

function clearWinLoseState() {
  document.body.classList.remove("green-bg");
  document.body.classList.remove("red-bg");
  document.getElementById("end-game-text").innerHTML = "";
}

//////////////////////////
// MAIN DRIVER
//////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  createGrid();
  createDifficultyButtons();
  updateLeaderboards(current_difficulty);
  editGamerTag();
  playMusic();
});
