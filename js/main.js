angular.module('Chess', [])
  .controller('MainCtrl', function($filter, $window, $scope, $timeout){
    var cell_position = $filter('cell_position');
    var self          = this;
    $window.g = this;
    angular.extend(this, {
      Board:            new ChessBoard(),
      highlightedCells: [],
      selectedPiece:    false,
      clickedCell:      false,
      resetGame: function(){
        self.selectedPiece    = self.clickedCell = false;
        self.highlightedCells = [];
        self.Board            = new ChessBoard();
      },
      cellHasPiece: function(row, col){
        return !!self.Board.getPos(cell_position(row, col));
      },
      isPieceSelected: function(row, col){
        var pos = cell_position(row, col);
        return(self.selectedPiece && self.selectedPiece.pos == pos);
      },
      isCellHighlighted: function(row, col){
        var pos = cell_position(row, col);
        return self.highlightedCells.indexOf(pos) >= 0;
      },
      cellClicked: function(row, col){
        var pos               = cell_position(row, col);
        var piece             = self.Board.getPos(pos);
        self.highlightedCells = [];
        console.log(pos, 'clicked', piece);
        if(self.selectedPiece && self.selectedPiece.color == self.Board.turn && self.selectedPiece.canMoveTo(pos)){
          self.selectedPiece.moveTo(pos);
          self.selectedPiece = null;
          console.log('1');
        }
        else if(piece && piece.color == self.Board.turn)
        {
          if(piece == self.selectedPiece){
            self.selectedPiece = null;
          }
          else
          {
            self.highlightedCells = piece.getPlayableMoves();
            self.selectedPiece    = piece;
            console.log('2');
          }
        }
        else
        {
          self.selectedPiece = null;
          console.log('3');
        }
      }
    });

    $scope.$watchCollection('[game.Board.whiteInCheck, game.Board.blackInCheck]', function(n, o){
      if(_.any(n)){
        $timeout(function(){
          if(_.any([self.Board.whiteWon, self.Board.blackWon])){
            alert('Game Over!');
          }
          else
          {
            alert('Check!');
          }
        }, 0);
      }
    });
  })
  .filter('cell_position', function(){
    return function(row, col){
      return ChessBoard.prototype.rowColToPosition(row, col);
    };
  })
  .filter('get_piece_name', function($filter){
    var cell_position = $filter('cell_position');
    return function(board, row, col){
      var pos = cell_position(row, col);
      var piece = board.getPos(pos);
      if(piece){
        return(piece.color[0] + ' ' + piece.name);
      }
    };
  });

