angular.module('Chess', [])
.controller('MainCtrl', function(){
  angular.extend(this, {
    Board: new ChessBoard()
  });
});