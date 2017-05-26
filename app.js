angular.module('PathOfDamage', [])
.controller('Damage', function ($scope, DataService) {
  $scope.sections = DataService.getSections();

  $scope.hits = [{hit: 100}, {hit: 500}, {hit: 1000}, {hit: 2000}, {hit: 3000}, {hit: 5000}, {hit: 7500}, {hit: 10000}];
  $scope.resistance = 75;
  $scope.healthPool = 5000;

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
    if (table.total !== undefined) {
      table.total = 0;
      for (var i = 0; i < table.values.length - 1; i++) {
        if (table.values[i].enabled && !isNaN(table.values[i].value)) {
          table.total += table.values[i].value;
        }
      }
    }
    if (!skipUpdates) {
      $scope.updateHits();
    }
  };

  $scope.updateHits = function (skipSerialization) {
    for (var i = 0; i < $scope.hits.length - 1; i++) {
      $scope.hits[i] = calcDamage($scope.hits[i].hit);
    }
    if (!skipSerialization) {
      serializeData();
    }
  };

  $scope.updateHitTable = function (index) {
    if ($scope.hits[index].hit === null) {
      $scope.hits.splice(index, 1);
      return;
    }
    if ($scope.hits[$scope.hits.length - 1].hit !== null) {
      $scope.hits.push({hit: null});
    }
    $scope.hits[index] = calcDamage($scope.hits[index].hit);
    serializeData();
  };

  $scope.getHitWidth = function (damage) {
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

    $scope.sections.monster.tables.more.values.forEach(function (monsterMore) {
      hit *= (1 + monsterMore.value / 100)
    });

    var shifts = $scope.sections.shift.tables.shifts.total / 100;
    var shifted = hit * shifts * (1 - $scope.resistance / 100);
    hit *= (1 - shifts);

    var armor = $scope.sections.mitigation.armor / ($scope.sections.mitigation.armor + 10 * hit);
    var endurance = $scope.sections.mitigation.charges * .04;
    var additional = $scope.sections.mitigation.tables.reduction.total / 100;
    var reduction = armor + endurance + additional;
    if (reduction > .9) {
      reduction = .9;
    }
    hit *= (1 - reduction);

    hit -= $scope.sections.taken.tables.flat.total;

    var reducedTaken = $scope.sections.taken.tables.reduced.total / 100;
    hit *= (1 - reducedTaken);

    $scope.sections.taken.tables.less.values.forEach(function (lessTaken) {
      hit *= (1 - lessTaken.value / 100)
    });

    return {
      hit: initialHit,
      taken: Math.round(hit || 0),
      shifted: Math.round(shifted),
      remaining: Math.round($scope.healthPool - hit || 0)
    }
  }

  function serializeData() {
    var data = {
      i: DataService.serializeDataTable($scope.sections.monster.tables.increase.values),
      m: DataService.serializeDataTable($scope.sections.monster.tables.more.values),
      s: DataService.serializeDataTable($scope.sections.shift.tables.shifts.values),
      a: $scope.sections.mitigation.armor,
      c: $scope.sections.mitigation.charges,
      r: DataService.serializeDataTable($scope.sections.mitigation.tables.reduction.values),
      f: DataService.serializeDataTable($scope.sections.taken.tables.flat.values),
      d: DataService.serializeDataTable($scope.sections.taken.tables.reduced.values),
      l: DataService.serializeDataTable($scope.sections.taken.tables.less.values),
      h: DataService.serializeHits($scope.hits),
      t: $scope.resistance,
      p: $scope.healthPool
    };
    var stringified = rison.encode(data);
    stringified = LZString.compressToEncodedURIComponent(stringified);
    window.history.pushState({}, '', '?' + stringified);
  }

  function deserializeData(data) {
    $scope.sections.monster.tables.increase.values = DataService.deserializeDataTable(data.i);
    $scope.sections.monster.tables.more.values = DataService.deserializeDataTable(data.m);
    $scope.sections.shift.tables.shifts.values = DataService.deserializeDataTable(data.s);
    $scope.sections.mitigation.armor = data.a;
    $scope.sections.mitigation.charges = data.c;
    $scope.sections.mitigation.tables.reduction.values = DataService.deserializeDataTable(data.r);
    $scope.sections.taken.tables.flat.values = DataService.deserializeDataTable(data.f);
    $scope.sections.taken.tables.reduced.values = DataService.deserializeDataTable(data.d);
    $scope.sections.taken.tables.less.values = DataService.deserializeDataTable(data.l);
    $scope.hits = DataService.deserializeHits(data.h);
    $scope.resistance = data.t;
    $scope.healthPool = data.p;
  }

  // Load data from URL
  var data = window.location.search;
  if (data) {
    data = LZString.decompressFromEncodedURIComponent(data.substring(1));
    data = rison.decode(data);
    deserializeData(data)
  }

  // Add empty last row to tables
  Object.keys($scope.sections).forEach(function (sectionKey) {
    var section = $scope.sections[sectionKey];
    Object.keys(section.tables).forEach(function (tableKey) {
      var table = section.tables[tableKey];
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
  $scope.updateHits(true);

  window.onpopstate = function () {
    window.location.reload();
  }
});
