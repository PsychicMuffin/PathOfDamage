angular.module('PathOfDamage', ['ui.select'])
.controller('Damage', function ($scope, $document, $window, DataService, Modifiers) {
  const ELEMENTS = ['physical', 'fire', 'cold', 'lightning', 'chaos'];

  $scope.mitigation = DataService.getMitigation();
  $scope.taken = DataService.getDamageTaken();
  $scope.shift = DataService.getShifts();
  $scope.monster = DataService.getMonsterMods();
  $scope.hits = DataService.getHits();
  $scope.modifiers = Modifiers.getModifiers();

  $scope.maxSurvivableHit = 0;
  $scope.selected = {};
  const damageTable = angular.element(document.getElementById('damageTable'))[0];
  const addButton = angular.element(document.getElementById('addButton'))[0];
  var quickAdd;  //Timeout required so that the angular directive can add the DOM elements on render
  setTimeout(function () {
    quickAdd = angular.element(document.getElementsByClassName('ui-select-focusser'))[0]
  }, 100);
  var windowHeight = $window.innerHeight;
  var throttled = false;

  $scope.quickAdd = function () {
    if ($scope.selected.modifier) {
      var modifier = $scope.selected.modifier;
      if (modifier.elements) {
        var elements = {physical: false, fire: false, cold: false, lightning: false, chaos: false};
        modifier.elements.forEach(function (elementIndex) {
          elements[ELEMENTS[elementIndex]] = true;
        });
      }
      var table = $scope[modifier.section].tables[modifier.table];
      table.quickAddRow(modifier.name, modifier.value, elements);
      $scope.updateTotal(table);
      $scope.selected = {};
      quickAdd.focus();
    }
  };

  $scope.focusAddButton = function () {
    //timeout required so that the ui-selector can finish re-rendering
    setTimeout(function () {
      addButton.focus()
    }, 10);
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
    updateMaxSurvivableHit();
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
    var percent = (remaining / ($scope.mitigation.health + $scope.mitigation.es)) * 99;
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

    var monsterIncrease = $scope.monster.tables.increase.totals.total / 100;
    damage.physical *= (1 + monsterIncrease);

    var monsterMore = $scope.monster.tables.more.totals.total / 100;
    damage.physical *= (1 + monsterMore);

    var shiftTotals = $scope.shift.tables.shifts.totals;
    Object.keys(damage).forEach(function (element) {
      var shifted = damage.physical * shiftTotals[element] / 100;
      damage[element] += shifted * (1 - $scope.mitigation.resistance[element] / 100) || 0;
    });
    damage.physical -= damage.physical * $scope.shift.tables.shifts.totals.total / 100;

    var armor = $scope.mitigation.armor / (+$scope.mitigation.armor + 10 * damage.physical) || 0;
    var endurance = $scope.mitigation.charges * .04 || 0;
    var additional = $scope.mitigation.tables.reduction.totals.total / 100;
    var reduction = armor + endurance + additional;
    if (reduction > .9) {
      reduction = .9;
    }
    damage.physical *= (1 - reduction);

    Object.keys(damage).forEach(function (element) {
      if (damage[element] > 0) {
        damage[element] = Math.max(damage[element] + $scope.taken.tables.flat.totals[element], 0);
      }
    });

    Object.keys(damage).forEach(function (element) {
      damage[element] *= 1 + $scope.taken.tables.increased.totals[element] / 100;
    });

    Object.keys(damage).forEach(function (element) {
      damage[element] *= 1 + $scope.taken.tables.more.totals[element] / 100;
    });

    if ($scope.mitigation.chaosImmune) {
      damage.chaos = 0;
    }

    // Energy shield calculations
    var esDamage = Object.assign({}, damage);
    if (!$scope.mitigation.chaosBlocked) {
      delete esDamage.chaos;
    }
    var totalEsDamage = totalValues(esDamage);
    var esNormalization = Math.min($scope.mitigation.es / totalEsDamage, 1) || 0;

    var lifeDamage = {chaos: damage.chaos};
    Object.keys(esDamage).forEach(function (element) {
      lifeDamage[element] = esDamage[element] - esDamage[element] * esNormalization;
    });
    var totalLifeDamage = totalValues(lifeDamage);

    // Mind over Mater calculations
    if (totalLifeDamage > 0) {
      var manaDamage = {};
      var manaTotals = $scope.shift.tables.mana.totals;
      Object.keys(manaTotals).forEach(function (element) {
        manaDamage[element] = lifeDamage[element] * manaTotals[element] / 100;
      });
      var totalManaDamage = totalValues(manaDamage);
      var manaNormalization = Math.min($scope.mitigation.mana / totalManaDamage, 1);

      Object.keys(manaDamage).forEach(function (element) {
        var normalizedManaDamage = manaDamage[element] * manaNormalization;
        damage[element] -= normalizedManaDamage;
        totalLifeDamage -= normalizedManaDamage;
      });
    }

    var totalDamage = damage.physical + damage.fire + damage.cold + damage.lightning + damage.chaos;
    var eleDamage = damage.fire + damage.cold + damage.lightning + damage.chaos;
    var esTaken = Math.min(totalEsDamage, $scope.mitigation.es);
    var manaTaken = Math.min(totalManaDamage, $scope.mitigation.mana);

    return {
      hit: hit,
      totalTaken: Math.round(totalDamage),
      physTaken: Math.round(damage.physical),
      eleTaken: Math.round(eleDamage),
      manaTaken: Math.round(manaTaken),
      mitigated: Math.round(hit - totalDamage),
      healthRemaining: Math.round($scope.mitigation.health - totalLifeDamage),
      esRemaining: Math.round($scope.mitigation.es - esTaken)
    };
  }

  function totalValues(object) {
    return Object.keys(object).reduce(function (previous, key) {
      return previous + object[key];
    }, 0)
  }

  function updateMaxSurvivableHit() {
    var hit = 0;
    var start = Math.round(Math.log10($scope.mitigation.health)) - 1;
    var calcLimit = 0;
    for (var i = start; i > -1; i--) {
      var calc = calcDamage(hit);
      while (calc.healthRemaining > 0 && calcLimit++ < 1000) {
        hit += Math.pow(10, i);
        calc = calcDamage(hit);
      }
      hit -= Math.pow(10, i);
    }
    $scope.maxSurvivableHit = calcLimit < 1000 ? hit : 'Error';
  }

  function serializeData() {
    var stringified = DataService.encodeData($scope.mitigation, $scope.taken, $scope.shift, $scope.monster, $scope.hits);
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
  [$scope.mitigation, $scope.taken, $scope.shift, $scope.monster].forEach(function (section) {
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
