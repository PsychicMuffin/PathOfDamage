angular.module('PathOfDamage', [])
.controller('Damage', function ($scope, DataService) {
  $scope.sections = DataService.getSections();

  $scope.hits = [{hit: 100}, {hit: 500}, {hit: 1000}, {hit: 2000}, {hit: 3000}, {hit: 5000}, {hit: 7500}, {hit: 10000}];
  $scope.resistance = 75;
  $scope.healthPool = 5000;

  $scope.clear = function () {
    window.location.search = '';
    window.location.reload();
  };

  $scope.add = function (table) {
    var lastEntry = table.values[table.values.length - 1];
    if (lastEntry.name !== '' || lastEntry.value !== null) {
      table.values.push({
        enabled: true,
        name: '',
        value: null
      });
    }
    $scope.updateTotal(table);
  };

  $scope.delete = function (table, index) {
    table.values.splice(index, 1);
    $scope.updateTotal(table);
  };

  $scope.updateTotal = function (table, skipUpdates) {
    table.totalCalc();
    if (!skipUpdates) {
      $scope.updateDamageValues();
    }
  };

  $scope.updateDamageValues = function (skipSerialization) {
    for (var i = 0; i < $scope.hits.length - 1; i++) {
      $scope.hits[i] = calcDamage($scope.hits[i].hit);
    }
    if (!skipSerialization) {
      serializeData();
    }
  };

  $scope.updateHitRow = function (index) {
    if (index === $scope.hits.length - 1 || $scope.hits[index].hit !== null) {
      $scope.hits[index] = calcDamage($scope.hits[index].hit);
      if ($scope.hits[$scope.hits.length - 1].hit !== null) {
        $scope.hits.push({hit: null});
      }
    } else {
      $scope.hits.splice(index, 1);
    }
    serializeData();
  };

  $scope.getBarWidth = function (damage) {
    var percent = (damage / $scope.healthPool) * 100;
    if (percent > 100) {
      percent = 100;
    }
    return {width: (percent || 0) + "%"};
  };

  function calcDamage(hit) {
    if (hit === null) {
      return {};
    }
    var initialHit = hit;

    var monsterIncrease = $scope.sections.monster.tables.increase.total / 100;
    hit *= (1 + monsterIncrease);

    var monsterMore = $scope.sections.monster.tables.more.total / 100;
    hit *= (1 + monsterMore);

    var shifts = $scope.sections.shift.tables.shifts.total / 100;
    var shifted = hit * shifts * (1 - $scope.resistance / 100);
    hit -= shifted;

    var armor = $scope.sections.mitigation.armor / ($scope.sections.mitigation.armor + 10 * hit);
    var endurance = $scope.sections.mitigation.charges * .04;
    var additional = $scope.sections.mitigation.tables.reduction.total / 100;
    var reduction = armor + endurance + additional;
    if (reduction > .9) {
      reduction = .9;
    }
    hit *= (1 - reduction);

    hit += $scope.sections.taken.tables.flat.total;
    hit = Math.max(hit, 0);

    var increasedTaken = $scope.sections.taken.tables.increased.total / 100;
    hit *= (1 + increasedTaken);

    var moreTaken = $scope.sections.taken.tables.more.total / 100;
    hit *= (1 + moreTaken);

    return {
      hit: initialHit,
      taken: Math.round(hit || 0),
      shifted: Math.round(shifted),
      remaining: Math.round($scope.healthPool - hit || 0)
    }
  }

  function serializeData() {
    var stringified = DataService.encodeData($scope);
    stringified = LZString.compressToEncodedURIComponent(stringified);
    window.history.pushState({}, '', '?' + stringified);
  }

  // Load data from URL
  var dataString = window.location.search;
  if (dataString) {
    dataString = LZString.decompressFromEncodedURIComponent(dataString.substring(1));
    DataService.decodeData($scope, dataString);
  }

  // Add empty last row to tables
  Object.keys($scope.sections).forEach(function (sectionKey) {
    var section = $scope.sections[sectionKey];
    Object.keys(section.tables).forEach(function (tableKey) {
      var table = section.tables[tableKey];
      table.totalCalc = table.totalCalc || DataService.additive;
      table.values = table.values || [];
      table.values.push({
        enabled: true,
        name: '',
        value: null
      });
      $scope.updateTotal(table, true);
    });
  });

  $scope.hits.push({hit: null});
  $scope.updateDamageValues(true);

  window.onpopstate = function () {
    window.location.reload();
  }
});
