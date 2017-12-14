// AI
function AI(difficulty) {
  var game = {};
  this.difficulty = difficulty;
  this.plays = function(_game) {
    game = _game;
  }
  this.turn = function(turn) {
    switch (this.difficulty) {
      case "novice":
        aiMoveNovice(turn);
        break;
      case "intermediate":
        aiMoveIntermediate(turn);
        break;
      case "expert":
        aiMoveExpert(turn);
        break;
                           }
  }

  function aiMoveNovice(turn) {
    var openPositions = game.currentState.emptySquares();
    var randomPosition = openPositions[Math.floor(Math.random() * openPositions.length)];
    var nextAction = new AIaction(randomPosition);
    var nextState = nextAction.next(game.currentState);
    var $this = $(".square[name="+nextAction.position+"]");
    $this.find(".back").append("<span class='glyphicon glyphicon-star' aria-hidden='true'></span>");
    setTimeout(function() {
      $this.addClass("flip");
      game.advanceState(nextState);
    }, 800);
  }
  
  function aiMoveExpert(turn) {
    var openPositions = game.currentState.emptySquares();
    var nextActions = openPositions.map(function(position) {
      var nextAction = new AIaction(position);
      var nextState = nextAction.next(game.currentState);
      nextAction.minimax = minimax(nextState);
      return nextAction;
    });
    if (turn === "X") {
      nextActions.sort(function(firstAction, secondAction) {
        return secondAction.minimax - firstAction.minimax;
      }); 
    } else {
      nextActions.sort(function(firstAction, secondAction) {
        return firstAction.minimax - secondAction.minimax;     
      });
    }
    var nextAction = nextActions[0];      
    var nextState = nextAction.next(game.currentState);   
    var $this = $(".square[name="+nextAction.position+"]");
    $this.find(".back").append("<span class='glyphicon glyphicon-star' aria-hidden='true'></span>");
    setTimeout(function() {
      $this.addClass("flip");
      game.advanceState(nextState);
    }, 800);
    
  }
  
  function aiMoveIntermediate(turn) {
    var probability = Math.random() * 100;
    console.log(probability);
    if (probability > 35) {
      aiMoveExpert(turn);
    } else {
      aiMoveNovice(turn);
    }
  }
  
  function minimax(state) {
    if (state.endNode() !== "continue") {
      return Game.score(state);
    } else {
      var stateScore;
      if (state.turn === "X") {
        stateScore = -1000;
      } else {
        stateScore = 1000;
      }
      var nextPositions = state.emptySquares();
      var nextStates = nextPositions.map(function(position) {
        var nextAction = new AIaction(position);
        var nextState = nextAction.next(state);
        return nextState;
      });
      
      nextStates.forEach(function(nextState) {
        var nextScore = minimax(nextState);
        if (state.turn === "X") {
          if (nextScore > stateScore) {
            stateScore = nextScore;
          }
        } else {
          if (nextScore < stateScore) {
            stateScore = nextScore;
          }
        }
      });
      return stateScore;
    }
  }
}

var AIaction = function(position) {
  this.position = position;
  this.minimax = 0;
  this.next = function(state) {
    var nextState = new State(state);
    nextState.board[this.position] = state.turn;
    if (state.turn === "O") {
      nextState.movesCount++;
    }
    nextState.nextTurn();
    return nextState;
  }
}

function uiDisplay() {
  var responses = ["Its your turn!","Gogogo!","Pick a square!","Choose wisely!"];
  this.humanMessage = function() {
    $("#uiMessage").fadeOut(500, function() {
      var responseIndex = Math.floor(Math.random() * responses.length);
      $(this).text(responses[responseIndex]).removeClass("btn-danger").addClass("btn-primary");
      $(this).fadeIn(500);    
    });
  }
  
  this.finishGame = function(result) {
    var endMessages = ["It's a draw!", "You win!","You lose!"];
    $("#uiMessage").fadeOut(1000, function() {
      switch (result) {
        case "draw": 
          $(this).text(endMessages[0]);
          break;
        case "X won":
          $(this).text(endMessages[1]);
          break;
        case "O won":
          $(this).text(endMessages[2]);
          break;          
                    }
        $(this).append(" Play Again?").removeClass("btn-primary").addClass("btn-danger");
        $(this).fadeIn(1500);
    });
  }
}

// board
function Board() {
  var board = new Array(9);
  for (var i = 0; i < board.length; i++) {
    board[i] = "empty";
  }
  return board;
}

// game object
function Game(aiPlayer) {
  this.ai = aiPlayer;
  this.uiDisplay = new uiDisplay(); 
  this.currentState = new State();
  this.currentState.board = new Board();
  this.currentState.turn = "X";
  this.status = "start";
  
  this.advanceState = function(_state) {
    this.currentState = _state;
    // game has ended
    if (this.currentState.endNode() !== "continue") {
      this.status = "end";
      this.uiDisplay.finishGame(this.currentState.result);
    } else {
      if (this.currentState.turn === "X") {
        this.uiDisplay.humanMessage();
      } else {
        this.ai.turn("O");
      }
    }
  }
  
  this.start = function() {
    if (this.status === "start") {
      this.advanceState(this.currentState);
      this.status = "game running";
    }
  }
}
  Game.score = function(_state) {
    if (_state.result === "X won") {
      return 10 - _state.movesCount;
    } else if(_state.result === "O won") {
      return -10 + _state.movesCount;
    } else {
      return 0;
    } 
  }

var newGame = {};
// start game
$('#uiMessage').click(function() {
  var restartGame = (newGame.game && newGame.game.status === "end");
  if (restartGame) {
    $(".square").each(function() {
      $(this).removeClass("flip");
      $(this).find(".back").text("");      
    });
  } 
  if (!newGame.game || restartGame) {
    var difficulty = $("input[name=difficulty]:checked").val();
    var ai = new AI(difficulty);
    newGame.game = new Game(ai);
    ai.plays(newGame.game);
    newGame.game.start();     
  }
   
});

$(".square").click(function() {
  var $this = $(this);
  var square = parseInt($this.attr("name"));
  if (newGame.game.status === "game running" && newGame.game.currentState.turn === "X" && newGame.game.currentState.board[square] === "empty") {
    var nextState = new State(newGame.game.currentState);
    nextState.board[square] = "X";
    nextState.nextTurn();
    $this.find(".back").append("<span class='glyphicon glyphicon-heart' aria-hidden='true'></span>");      
    $this.addClass("flip")      
    newGame.game.advanceState(nextState);
  }    
});

// game state
function State(previous) {
  this.turn = "";
  this.movesCount = 0;
  this.result = "continue";
  this.board = [];

  if (typeof previous !== "undefined") {
    this.board = new Array(previous.board.length);
    for (var i = 0; i < previous.board.length; i++) {
      this.board[i] = previous.board[i];
    }
    this.turn = previous.turn;
    this.result = previous.result;
    this.movesCount = previous.movesCount;
    
  }
  this.emptySquares = function() {
    var empty = [];
    for (var i = 0; i < this.board.length; i++) {
      if (this.board[i] === "empty") {
        empty.push(i);
      }
    }
    return empty;
  }
  this.endNode = function() {
    this.result = winningConditions(this.board);
    return this.result;
  }
  this.nextTurn = function() {
    this.turn = this.turn === "X" ? "O" : "X";
  }
}

// winning conditions
function winningConditions(board) {
  var combinations = [[0,1,2],[0,3,6],[0,4,8],[1,4,7],[2,4,6],[2,5,8],[3,4,5],[6,7,8]]; 
  var winIndex = -1;
  var winner = "";
  for (var i = 0; i < combinations.length; i++) {
    if (win(board, combinations[i])) {
      winIndex = i;
      winner = board[combinations[i][0]];
    }
  }
  // won game
  if (winIndex !== -1) {
    return winner + ' won';
  // tie game 
  } else if (board.indexOf('empty') === -1) {
    return "draw";
  // game not over
  } else {
    return "continue";
  }
}
  
// checking for a win
function win(board,indexes) {
  return (board[indexes[0]] === board[indexes[1]] && board[indexes[0]] === board[indexes[2]] && board[indexes[0]] !== 'empty');
}
