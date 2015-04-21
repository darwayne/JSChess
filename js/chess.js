function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x3|0x8)).toString(16);
  });
  return uuid;
}

function permutatedValidMoves(keep_checking){
  return function(pos, color, board){
    var position     = (pos || this.pos).toUpperCase();
    var my_color     = color || this.color;
    var my_board     = board || this.board;
    var permutations = this.permutations;
    return this.getValidMovesByPermutations(permutations, keep_checking, position, my_color, board);
  };
}

function ChessBoard(){
  var colors = ['white', 'black'];
  _.extend(this, {
    whitePiecesEaten: [],
    blackPiecesEaten: [],
    turn: colors[0],
    whiteInCheck: false,
    blackInCheck: false,
    whitePieces: [],
    blackPieces: []
  });
  this.generateLayout();
  this.initPieces();
}

_.extend(ChessBoard.prototype, {
  positionRegex: /^[a-z][1-8]$/i,
  generateLayout: function(){
    this.layout = [];
    for(var i = 0; i < 8; i++){
      this.layout.push(new Array(8));
    }
  },
  isValidPos: function(pos){
    var valid = true;
    try {
      this.getPos(pos);
    }
    catch(e){
      valid = false;
    }

    return valid;
  },
  initPieces: function(){
    var board = this;
    var i,pos, color;
    var default_positions = {
      Knight: ['b1', 'g1', 'b8', 'g8'],
      Pawn: [],
      King: ['e1', 'e8'],
      Rook: ['a1', 'h1', 'a8', 'h8'],
      Queen: ['d1', 'd8'],
      Bishop: ['c1', 'f1', 'c8', 'f8']
    };
    var posMath = ChessPiece.prototype.posMath;
    var new_pos = 'i2';
    for(i = 1; i < 9; i++){
      new_pos = posMath(new_pos, [-1, 0]);
      default_positions.Pawn.push(new_pos);
    }
    new_pos = 'i7';
    for(i = 1; i < 9; i++){
      new_pos = posMath(new_pos, [-1, 0]);
      default_positions.Pawn.push(new_pos);
    }
    _.each(default_positions, function(positions, piece_name){
      for(i = 0; i < positions.length; i++){
        pos = positions[i];
        color = parseInt(pos[1], 10) > 5 ? 'black' : 'white';
        var piece = new window[piece_name](color, pos, board);
        board[color + 'Pieces'].push(piece);
        if(piece.name == 'king'){
          self[color + 'King'] = piece;
        }
        board.setPos(pos, piece);
      }
    });
    
  },
  isPosClear: function(pos){
    try{
      if(!this.getPos(pos)){
        return true;
      }
    }catch(e){}
  },
  getPos: function(pos){
    return this.handlePos(true, pos);
  },
  setPos: function(pos, value){
    this.handlePos(false, pos, value);
  },
  handlePos: function(is_get, pos, value){
    var position = pos.toUpperCase();
    if(this.positionRegex.test(position)){
      var row = position.charCodeAt(0) - 65;
      var col = parseInt(position[1], 10) - 1;
      if(is_get){
        return this.layout[row][col];
      }
      else
      {
        this.layout[row][col] = value;
      }
    }
    else
    {
      throw 'Invalid position provided';
    }
  }
});

function ChessPiece(color, pos, board)
{
  this.id    = generateUUID();
  this.color = color;
  this.pos   = pos.toUpperCase();
  this.moves = 0;
  this.board = board;
}

_.extend(ChessPiece.prototype, {
  getEnemyColor: function(color){
    var my_color = color || this.color;
    var result = my_color == 'white' ? 'black' : 'white';
    return result;
  },
  isCheckingEnemyKing: function(){
    var enemy_color   = this.getEnemyColor();
    var enemy_king    = this.board[enemy_color + 'King'];
    var checking_king = this.getValidMoves().indexOf(enemy_king.pos);
    this.board[enemy_color + 'InCheck'] = checking_king;
    return checking_king;
  },
  moveToPos: function(pos){
    this.moves++;
    var enemy_color = this.getEnemyColor();
    if(this.enemyAtPos(pos)){
      var enemy = this.board.getPos(pos);
      this.board[enemy_color+'PiecesEaten'].push(enemy);
      if(enemy == this.board[enemy_color + 'King']){
        this.board[this.color + 'Won'] = true;
      }
      var enemy_pieces = this.board[enemy_color + 'Pieces'];
      var index = enemy_pieces.indexOf(enemy);
      if(index >= 0){
        enemy_pieces.splice(index, 1);
      }
    }
    _.each(this.board.colors, function(color){
      _.each(this.board[color + 'Pieces'], function(piece){
        piece.isCheckingEnemyKing();
      });
    });
    this.board.setPos(pos, this);
    this.board.setPos(this.pos, '');
    this.pos = pos;

    return this.moves;
  },
  moveTo: function(pos){
    if(this.isValidPos(pos)){
      return this.moveToPos(pos);
    }
  },
  enemyAtPos: function(pos, color){
    var result = this.board.getPos(pos);
    var my_color = color || this.color;
    if(result && result.color != my_color){
      return result;
    }
  },
  isValidPos: function(pos){
    var valid_moves   = this.getValidMoves();
    var enemy_color   = this.getEnemyColor();
    var self          = this;
    var is_valid_move = this.canMoveTo(pos);
    if(is_valid_move && this.board[this.color + 'InCheck']){
      if(this.wouldMoveStopCheck(pos)){
        return true;
      }
      else
      {
        return false;
      }
    }

    return is_valid_move;
  },
  wouldMoveStopCheck: function(move){
    var virtual_board = _.cloneDeep(this.board);
    var my_pos = this.pos;
    var virtual_me = virtual_board.getPos(my_pos);
    if(virtual_me.canMoveTo(move)){
      virtual_me.moveToPos(pos);
      if(!virtual_board[this.color + 'InCheck']){
        return true;
      }
    }
  },
  canMoveTo: function(pos){
    return (valid_moves.indexOf(pos.toUpperCase()) >= 0);
  },
  posMath: function(arg1, arg2){
    var pos = arg1;
    var nums = arg2;
    if(arguments.length == 1){
      pos = this.pos;
      nums = arg1;
    }
    return String.fromCharCode(pos.charCodeAt(0) + nums[0]) + String.fromCharCode(pos.charCodeAt(1) + nums[1]);
  },
  clearToMove: function(pos, color, board){
    var my_color     = color || this.color;
    var result       = (board || this.board).getPos(pos);
    var has_enemy    = this.enemyAtPos(pos);
    return (!result || has_enemy);
  },
  getValidMovesByPermutations: function(permutations, keep_checking, pos, color, board){
    var position = pos || this.pos;
    var my_color = color || this.color;
    var valid_moves  = [];
    var new_pos, is_valid;
    var my_board = board || this.board;
    for(var i = 0; i < permutations.length; i++){
      new_pos = position;
      do {
        new_pos = this.posMath(new_pos, permutations[i]);
        is_valid = my_board.isValidPos(new_pos);
        if(is_valid){
          if(!keep_checking){
            is_valid = false;
          }
          if(this.clearToMove(new_pos, my_color, board)){
            valid_moves.push(new_pos);
            if(my_board.getPos(new_pos)){
              new_pos = null;
            }
          }
        }
      }while(is_valid && new_pos);
    }

    return valid_moves;
  }
});

function Knight(color, pos, board){
  this.name = 'knight';
  _.extend(this, new ChessPiece(color, pos, board));
  board.setPos(pos, this);
}

_.extend(Knight.prototype, ChessPiece.prototype, {
  getValidMoves: function(pos, color){
    var my_color = color || this.color;
    var position = (pos || this.pos).toUpperCase();
    var possible_moves = this.getPossibleMoves(position);
    var valid_moves = [];
    var result;
    for(var i = 0; i < possible_moves.length; i++){
      if(this.clearToMove(possible_moves[i])){
        valid_moves.push(possible_moves);
      }
    }

    return valid_moves;
  },
  getPossibleMoves: function(pos, color){
    var position = (pos || this.pos).toUpperCase();
    var possibilities = [];
    var permutations = [[2, 1], [-2, 1], [-2, -1], [2, -1]];
    var new_pos = null;
    var inverse_permutations = [];
    var i,p;
    for(i = 0; i < permutations.length; i++){
      p = permutations[i];
      inverse_permutations.push([p[1], p[0]]);
    }
    permutations = permutations.concat(inverse_permutations);
    for(i = 0; i < permutations.length; i++){
      new_pos = this.posMath(position, permutations[i]);
      if(this.board.isValidPos(new_pos)){
        possibilities.push(new_pos);
      }
    }

    return possibilities;
  }
});

function Bishop(color, pos, board){
  this.name = 'bishop';
  _.extend(this, new ChessPiece(color, pos, board));
  board.setPos(pos, this);
}

_.extend(Bishop.prototype, ChessPiece.prototype, {
  permutations: [[1, 1], [-1, 1], [1, -1], [-1, -1]],
  getValidMoves: function(pos, color, board){
    var position     = (pos || this.pos).toUpperCase();
    var my_color     = color || this.color;
    var permutations = this.permutations;
    return this.getValidMovesByPermutations(permutations, true, position, my_color, board);
  }
});

function Rook(color, pos, board){
  this.name = 'rook';
  _.extend(this, new ChessPiece(color, pos, board));
  board.setPos(pos, this);
}

_.extend(Rook.prototype, ChessPiece.prototype, {
  permutations: [[1, 0], [0, 1], [-1, 0], [0, -1]],
  getValidMoves: permutatedValidMoves(true)
});

function Queen(color, pos, board){
  this.name = 'queen';
  _.extend(this, new ChessPiece(color, pos, board));
  board.setPos(pos, this);
}
_.extend(Queen.prototype, ChessPiece.prototype, {
  permutations: Rook.prototype.permutations.concat(Bishop.prototype.permutations),
  getValidMoves: permutatedValidMoves(true)
});

function King(color, pos, board){
  this.name = 'king';
  _.extend(this, new ChessPiece(color, pos, board));
  board.setPos(pos, this);
}

_.extend(King.prototype, ChessPiece.prototype, {
  permutations: Queen.prototype.permutations,
  getValidMoves: permutatedValidMoves(false)
});

function Pawn(color, pos, board){
  this.name = 'pawn';
  _.extend(this, new ChessPiece(color, pos, board));
  board.setPos(pos, this);
}

_.extend(Pawn.prototype, ChessPiece.prototype, {
  getValidMoves: function(pos, color, board){
    var position          = (pos || this.pos).toUpperCase();
    var my_color          = color || this.color;
    var my_board          = board || this.board;
    var is_white          = my_color == 'white';
    var i, new_pos, result, valid_moves = [];
    var move_permutations = is_white ? [[0, 1]] : [[0, -1]];
    var eat_permutations  = is_white ? [[1, 1], [-1, 1]] : [[1, -1], [-1, -1]];
    if(!this.moves){
      move_permutations.push( is_white ? [0, 2] : [0, -2]);
    }
    for(i = 0; i < move_permutations.length; i++){
      new_pos = this.posMath(move_permutations[i]);
      if(my_board.isPosClear(new_pos)){
        valid_moves.push(new_pos);
      }
    }
    for(i = 0; i < eat_permutations.length; i++){
      new_pos = this.posMath(eat_permutations[i]);
      if(my_board.isValidPos(new_pos) && this.enemyAtPos(new_pos)){
        valid_moves.push(new_pos);
      }
    }

    return valid_moves;
  }
});



