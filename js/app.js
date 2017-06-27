angular.module('PathOfDamage', ['ui.select'])
.controller('Damage', function ($scope, $document, $window, DataService, Items) {
  const ELEMENTS = ['physical', 'fire', 'cold', 'lightning', 'chaos'];

  DataService.init(ELEMENTS);
  $scope.sections = DataService.getSections();
  $scope.items = Items.getItems();
  $scope.hits = [{hit: 100}, {hit: 500}, {hit: 1000}, {hit: 2000}, {hit: 3000}, {hit: 5000}, {hit: 7500}, {hit: 10000}];
  $scope.selected = {};
  const damageTable = angular.element(document.getElementById('damageTable'))[0];
  const addButton = angular.element(document.getElementById('addButton'))[0];
  var quickAdd;  //Timeout required so that the angular directive can add the DOM elements on render
  setTimeout(function() { quickAdd = angular.element(document.getElementsByClassName('ui-select-focusser'))[0] }, 100);
  var windowHeight = $window.innerHeight;
  var throttled = false;

  $scope.quickAdd = function () {
    if ($scope.selected.item) {
      var item = $scope.selected.item;
      if (item.elements) {
        var elements = {physical: false, fire: false, cold: false, lightning: false, chaos: false};
        item.elements.forEach(function (elementIndex) {
          elements[ELEMENTS[elementIndex]] = true;
        });
      }
      var table = $scope.sections[item.section].tables[item.table];
      table.quickAddRow(item.name, item.value, elements);
      $scope.updateTotal(table);
      $scope.selected = {};
      quickAdd.focus();
    }
  };

  $scope.focusAddButton = function() {
    //timeout required so that the ui-selector can finish re-rendering
    setTimeout(function() { addButton.focus() },10);
  };

  $scope.setElement = function (table, row, element) {
    row.elements = {physical: false, fire: false, cold: false, lightning: false, chaos: false};
    row.elements[element] = true;
    $scope.updateTotal(table);
  };

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
      return hit.hit ? calcDamage(hit.hit) : hit;
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

  $scope.getBarWidth = function (remaining) {
    var percent = (remaining / ($scope.sections.mitigation.health + $scope.sections.mitigation.es)) * 99;
    if (percent > 99) {
      percent = 99;
    }
    return {width: (percent || 0) + '%'};
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

  $scope.round = function round(value) {
    return Math.round(value);
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
      damage[element] += shifted * (1 - $scope.sections.mitigation.resistance[element] / 100)  || 0;
    });
    damage.physical -= damage.physical * $scope.sections.shift.tables.shifts.totals.total / 100;

    var armor = $scope.sections.mitigation.armor / (+$scope.sections.mitigation.armor + 10 * damage.physical) || 0;
    var endurance = $scope.sections.mitigation.charges * .04 || 0;
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

    if ($scope.sections.mitigation.es >= totalTaken) {
      //Damage taken from mana before health is ignored if ES absorbs all of the damage
      var esTaken = totalTaken;
      var healthTaken = 0;
    } else {
      esTaken = $scope.sections.mitigation.es;

      var manaLeft = $scope.sections.mitigation.manaPool;
      var manaTotals = $scope.sections.shift.tables.mana.totals;
      var percentTakenAsHealth = 1- (esTaken / totalTaken);
      Object.keys(manaTotals).forEach(function (element) {
        var taken = Math.min(damage[element] * manaTotals[element] * percentTakenAsHealth / 100, manaLeft) || 0;
        damage[element] -= taken;
        manaLeft -= taken;
      });

      eleDamage = damage.fire + damage.cold + damage.lightning + damage.chaos;
      totalTaken = Math.round(damage.physical + eleDamage);
      healthTaken = Math.max(totalTaken - esTaken, 0);
    }

    return {
      hit: hit,
      totalTaken: totalTaken,
      healthTaken: healthTaken,
      esTaken: esTaken,
      physTaken: Math.round(damage.physical),
      eleTaken: Math.round(eleDamage),
      manaTaken: Math.round($scope.sections.mitigation.manaPool - manaLeft),
      mitigated: hit - totalTaken,
      healthRemaining: $scope.sections.mitigation.health - healthTaken,
      esRemaining: $scope.sections.mitigation.es - esTaken
    }
  }

  $scope.getMaximumSurvivableHit = function () {
    var hit = 0;
    var calc = calcDamage(hit);
    var start = Math.round(Math.log10($scope.sections.mitigation.health + $scope.sections.mitigation.es)) - 1;
    for (var i = start; i > -1; i--){
      while (calc.healthRemaining + calc.esRemaining > 0) {
        hit+= Math.pow(10,i);
        calc = calcDamage(hit);
      }
      hit -= Math.pow(10,i);
    }
    return hit;
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
      alert('Invalid URL: Unable to load data.');
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

  //Fix damage window to screen only if there is room and the header has been scrolled past.
  //Only allow scroll handling once per 50ms to not affect page performance
  $document.on('scroll', function () {
    if (!throttled) {
      throttled = true;
      var fixedTable = $window.scrollY > 80 && windowHeight > damageTable.offsetHeight + 20;
      if ($scope.fixedTable !== fixedTable) {
        $scope.$apply(function () {
          $scope.fixedTable = fixedTable
        });
      }
      setTimeout(function () {
        throttled = false;
      }, 50);
    }
  });

  angular.element($window).bind('resize', function () {
    windowHeight = $window.innerHeight;
  });

  $scope.hits.push({hit: null});
  $scope.updateDamageValues(true);

  window.onpopstate = function () {
    window.location.reload();
  };
});
