angular.module('PathOfDamage', [])
.controller('Damage', function ($scope, DataService) {
  $scope.sections = DataService.getSections();
  $scope.hits = [{hit: 100}, {hit: 500}, {hit: 1000}, {hit: 2000}, {hit: 3000}, {hit: 5000}, {hit: 7500}, {hit: 10000}];

  $scope.clear = function () {
    window.location.href = window.location.pathname;
  };

  $scope.add = function (table) {
    var lastRow = table.rows[table.rows.length - 1];
    if (lastRow.name !== '' || lastRow.value !== null) {
      table.addRow();
    }
    $scope.updateTotal(table);
  };

  $scope.delete = function (table, index) {
    table.rows.splice(index, 1);
    $scope.updateTotal(table);
  };

  $scope.inverse = function (table, index) {
    table.rows[index].value *= -1;
    $scope.updateTotal(table);
  };

  $scope.updateTotal = function (table, skipUpdates) {
    table.calcTotals();
    if (!skipUpdates) {
      $scope.updateDamageValues();
    }
  };

  $scope.updateDamageValues = function (skipSerialization) {
    $scope.hits = $scope.hits.map(function (hit) {
      return hit && hit.hit ? calcDamage(hit.hit) : null
    });
    if (!skipSerialization) {
      serializeData();
    }
  };

  $scope.updateHitRow = function (index) {
    $scope.hits[index] = calcDamage($scope.hits[index].hit);
    if ($scope.hits[$scope.hits.length - 1].hit !== null) {
      $scope.hits.push({hit: null});
    }
    serializeData();
  };

  $scope.deleteEmptyRow = function (index) {
    if (!$scope.hits[index].hit && index !== $scope.hits.length - 1) {
      $scope.hits.splice(index, 1);
      serializeData();
    }
  };

  $scope.getBarWidth = function (damage) {
    var percent = (damage / $scope.sections.mitigation.healthPool) * 99;
    if (percent > 99) {
      percent = 99;
    }
    return {width: (percent || 0) + "%"};
  };

  $scope.allSelected = function (row) {
    return Object.keys(row.elements).every(function (key) {
      return row.elements[key];
    })
  };

  $scope.selectAll = function (table, row) {
    var bool = !$scope.allSelected(row);
    Object.keys(row.elements).forEach(function (key) {
      row.elements[key] = bool;
    });
    $scope.updateTotal(table);
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

    var monsterIncrease = $scope.sections.monster.tables.increase.totals.total / 100;
    damage.physical *= (1 + monsterIncrease);

    var monsterMore = $scope.sections.monster.tables.more.totals.total / 100;
    damage.physical *= (1 + monsterMore);

    var shiftTotals = $scope.sections.shift.tables.shifts.totals;
    Object.keys(shiftTotals).forEach(function (element) {
      var shifted = damage.physical * shiftTotals[element] / 100;
      damage[element] += shifted * (1 - $scope.sections.mitigation.resistance[element] / 100);
    });
    damage.physical -= damage.physical * $scope.sections.shift.tables.shifts.totals.total / 100;

    var armor = $scope.sections.mitigation.armor / ($scope.sections.mitigation.armor + 10 * damage.physical);
    var endurance = $scope.sections.mitigation.charges * .04;
    var additional = $scope.sections.mitigation.tables.reduction.totals.total / 100;
    var reduction = armor + endurance + additional;
    if (reduction > .9) {
      reduction = .9;
    }
    damage.physical *= (1 - reduction);

    var flatTotals = $scope.sections.taken.tables.flat.totals;
    Object.keys(flatTotals).forEach(function (element) {
      if (damage[element] > 0) {
        damage[element] = Math.max(damage[element] + flatTotals[element], 0);
      }
    });

    var increasedTotals = $scope.sections.taken.tables.increased.totals;
    Object.keys(increasedTotals).forEach(function (element) {
      damage[element] *= 1 + increasedTotals[element] / 100;
    });

    var moreTotals = $scope.sections.taken.tables.more.totals;
    Object.keys(moreTotals).forEach(function (element) {
      damage[element] *= 1 + moreTotals[element] / 100;
    });

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

  $scope.getMaximumSurvivableHit = function() {
      var hit = 1;
      while (calcDamage(hit).remaining > 0){
        hit++;
      }
      return hit - 1;
  };

  function serializeData() {
    var stringified = DataService.encodeData($scope);
    stringified = LZString.compressToEncodedURIComponent(stringified);
    window.history.pushState({}, '', '?' + stringified);
  }

  // Load data from URL
  var dataString = window.location.search;
  if (dataString) {
    try {
      dataString = LZString.decompressFromEncodedURIComponent(dataString.substring(1));
      DataService.decodeData($scope, dataString);
    } catch (e) {
      alert("Invalid URL: Unable to load data.");
      $scope.clear();
    }
  }

  // Add empty last row to tables
  Object.keys($scope.sections).forEach(function (sectionKey) {
    var section = $scope.sections[sectionKey];
    Object.keys(section.tables).forEach(function (tableKey) {
      var table = section.tables[tableKey];
      table.addRow();
      $scope.updateTotal(table, true);
    });
  });

  $scope.hits.push({hit: null});
  $scope.updateDamageValues(true);

  window.onpopstate = function () {
    window.location.reload();
  }
});
