angular.module('Chess', [])
  .controller('MainCtrl', function($filter){
    var cell_position = $filter('cell_position');
    var self          = this;
    angular.extend(this, {
      Board: new ChessBoard(),
      highlightedCells: [],
      selectedPiece: false,
      clickedCell: false,
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
            self.highlightedCells = piece.getValidMoves();
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

    console.log(self.Board);
  })
  .filter('cell_position', function(){
    return function(row, col){
      return(String.fromCharCode(64 + col) + (9 - row));
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

