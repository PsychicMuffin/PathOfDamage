angular.module('PathOfDamage', [])
.controller('Damage', function ($scope, DataService) {
  $scope.sections = DataService.getSections();

  $scope.hits = [{hit: 100}, {hit: 500}, {hit: 1000}, {hit: 2000}, {hit: 3000}, {hit: 5000}, {hit: 7500}, {hit: 10000}];

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

  $scope.inverse = function (table, index) {
    table.values[index].value *= -1;
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
    var percent = (damage / $scope.sections.mitigation.healthPool) * 100;
    if (percent > 100) {
      percent = 100;
    }
    return {width: (percent || 0) + "%"};
  };

  $scope.getDisplayTotal = function (table) {
    return Math.round(table.total);
  };

  $scope.capitalize = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  function calcDamage(hit) {
    if (hit === null) {
      return {};
    }

    var damage = {
      physical: hit,
      fire: 0,
      cold: 0,
      lightning: 0,
      chaos: 0
    };

    var monsterIncrease = $scope.sections.monster.tables.increase.total / 100;
    damage.physical *= (1 + monsterIncrease);

    var monsterMore = $scope.sections.monster.tables.more.total / 100;
    damage.physical *= (1 + monsterMore);

    var totalShifted = 0;
    for (var i = 0; i < $scope.sections.shift.tables.shifts.values.length - 1; i++) {
      var shift = $scope.sections.shift.tables.shifts.values[i];
      if (shift.enabled && shift.value && shift.element) {
        var shifted = damage.physical * shift.value / 100;
        damage[shift.element] += shifted * (1 - $scope.sections.mitigation.resistance[shift.element] / 100);
        totalShifted += shifted;
      }
    }
    damage.physical -= totalShifted;

    var armor = $scope.sections.mitigation.armor / ($scope.sections.mitigation.armor + 10 * damage.physical);
    var endurance = $scope.sections.mitigation.charges * .04;
    var additional = $scope.sections.mitigation.tables.reduction.total / 100;
    var reduction = armor + endurance + additional;
    if (reduction > .9) {
      reduction = .9;
    }
    damage.physical *= (1 - reduction);

    damage.physical += $scope.sections.taken.tables.flat.total;
    damage.physical = Math.max(damage.physical, 0);

    var increasedTaken = $scope.sections.taken.tables.increased.total / 100;
    damage.physical *= (1 + increasedTaken);

    var moreTaken = $scope.sections.taken.tables.more.total / 100;
    damage.physical *= (1 + moreTaken);

    var eleDamage = damage.fire + damage.cold + damage.lightning + damage.chaos;
    var totalTaken = Math.round(damage.physical + eleDamage);
    return {
      hit: hit,
      taken: totalTaken,
      physTaken: Math.round(damage.physical),
      eleTaken: Math.round(eleDamage),
      mitigated: hit - totalTaken,
      remaining: $scope.sections.mitigation.healthPool - totalTaken
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
