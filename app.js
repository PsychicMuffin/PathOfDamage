var app = angular.module('PathOfDamage', []);
app.controller('Damage', function ($scope) {
  $scope.hits = [100, 500, 1000, 2000, 3000, 4000, 5000, 7500, 10000];

  $scope.buffs = {
    total: 0,
    values: []
  };
  $scope.shifts = {
    total: 0,
    values: []
  };
  $scope.damageReductions = {
    total: 0,
    values: []
  };
  $scope.flatTaken = {
    total: 0,
    values: []
  };
  $scope.reducedTaken = {
    total: 0,
    values: []
  };
  $scope.lessTaken = {
    total: 0,
    values: []
  };

  $scope.armor = "";
  $scope.charges = "";
  $scope.resistance = 75;

  $scope.add = function (table) {
    var lastEntry = table.values[table.values.length - 1];
    if (!lastEntry || lastEntry.name !== "" || lastEntry.value !== "") {
      table.values.push({
        enabled: true,
        name: "",
        value: ""
      });
    }
    $scope.updateTotal(table);
  };

  $scope.delete = function (table, index) {
    if (index !== table.length - 1) {
      table.splice(index, 1);
    }
    $scope.updateTotal(table);
  };

  $scope.updateTotal = function (table) {
    table.total = 0;
    for (var i=0; i<table.values.length; i++) {
      if (table.values[i].enabled && !isNaN(table.values[i].value)) {
        table.total += table.values[i].value;
      }
    }
  };

  $scope.calcDamage = function (hit) {
    var buffs = $scope.buffs.total / 100;
    hit *= (1 + buffs);

    var shifts = $scope.shifts.total / 100;
    var shifted = hit * shifts * (1 - $scope.resistance / 100);
    hit *= (1 - shifts);

    var armor = $scope.armor / ($scope.armor + 10 * hit);
    var endurance = $scope.charges * .04;
    var additional = $scope.damageReductions.total / 100;
    var reduction = armor + endurance + additional;
    if (reduction > .9) {
      reduction = .9;
    }
    hit *= (1 - reduction);

    hit -= $scope.flatTaken.total;

    var reducedTaken =  $scope.reducedTaken.total / 100;
    hit *= (1 - reducedTaken);

    for (var i=0; i<$scope.lessTaken.values.length - 1; i++) {
      var lessTaken = $scope.lessTaken.values[i].value / 100;
      hit *= (1 - lessTaken);
    }

    return Math.round(hit) + " (" + Math.round(shifted) + ")";
  };

  $scope.add($scope.buffs);
  $scope.add($scope.shifts);
  $scope.add($scope.damageReductions);
  $scope.add($scope.flatTaken);
  $scope.add($scope.reducedTaken);
  $scope.add($scope.lessTaken);
});