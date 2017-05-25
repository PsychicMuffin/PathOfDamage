angular.module('PathOfDamage', [])
.controller('Damage', function ($scope, DataService) {
  $scope.sections = DataService.getSections();

  $scope.hits = [{hit: 100}, {hit: 500}, {hit: 1000}, {hit: 2000}, {hit: 3000},
    {hit: 4000}, {hit: 5000}, {hit: 7500}, {hit: 10000}];
  $scope.resistance = 75;
  $scope.health = 7000;

  $scope.updateHit = function (index, skipStringify) {
    if ($scope.hits[index].hit === null) {
      $scope.hits.splice(index, 1);
    }
    if (index > 0 && $scope.hits[$scope.hits.length - 1].hit !== null) {
      $scope.hits.push({hit: null});
    }
    if ($scope.hits[index]) {
      $scope.hits[index] = calcDamage($scope.hits[index].hit);
    }
    if (!skipStringify) {
      $scope.stringifyUrlData();
    }
  };

  $scope.add = function (table, skipStringify) {
    var lastEntry = table.values[table.values.length - 1];
    if (!lastEntry || lastEntry.name !== '' || lastEntry.value !== null) {
      table.values.push({
        enabled: true,
        name: '',
        value: null
      });
    }
    $scope.updateTotal(table, skipStringify);
  };

  $scope.delete = function (table, index, skipStringify) {
    table.values.splice(index, 1);
    $scope.updateTotal(table, skipStringify);
  };

  $scope.updateTotal = function (table, skipStringify) {
    if (table.total !== undefined) {
      table.total = 0;
      for (var i = 0; i < table.values.length - 1; i++) {
        if (table.values[i].enabled && !isNaN(table.values[i].value)) {
          table.total += table.values[i].value;
        }
      }
    }
    $scope.updateHits(true);
    if (!skipStringify) {
      $scope.stringifyUrlData();
    }
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
      remaining: Math.round($scope.health - hit || 0)
    }
  }

  $scope.updateHits = function(skipStringify) {
    for (var i = 0; i < $scope.hits.length - 1; i++) {
      $scope.updateHit(i, true);
    }
    if (!skipStringify) {
      $scope.stringifyUrlData();
    }
  };

  $scope.getWidth = function(damage) {
    var percent = (damage / $scope.health) * 100;
    if (percent > 100) {
      percent = 100;
    }
    return {width: (percent || 0) + "%"};
  };

  $scope.stringifyUrlData = function () {
    var data = {
      i: DataService.generateDataList($scope.sections.monster.tables.increase.values),
      m: DataService.generateDataList($scope.sections.monster.tables.more.values),
      s: DataService.generateDataList($scope.sections.shift.tables.shifts.values),
      a: $scope.sections.mitigation.armor,
      c: $scope.sections.mitigation.charges,
      r: DataService.generateDataList($scope.sections.mitigation.tables.reduction.values),
      f: DataService.generateDataList($scope.sections.taken.tables.flat.values),
      d: DataService.generateDataList($scope.sections.taken.tables.reduced.values),
      l: DataService.generateDataList($scope.sections.taken.tables.less.values),
      h: DataService.generateHitList($scope.hits.slice(0,-1)),
      t: $scope.resistance
    };
    var stringified = rison.encode(data);
    stringified = LZString.compressToEncodedURIComponent(stringified);
    window.history.pushState({}, '', '?' + stringified);
  };

  function loadUrlData(data) {
    $scope.sections.monster.tables.increase.values = DataService.generateDataTable(data.i);
    $scope.sections.monster.tables.more.values = DataService.generateDataTable(data.m);
    $scope.sections.shift.tables.shifts.values = DataService.generateDataTable(data.s);
    $scope.sections.mitigation.armor = data.a;
    $scope.sections.mitigation.charges = data.c;
    $scope.sections.mitigation.tables.reduction.values = DataService.generateDataTable(data.r);
    $scope.sections.taken.tables.flat.values = DataService.generateDataTable(data.f);
    $scope.sections.taken.tables.reduced.values = DataService.generateDataTable(data.d);
    $scope.sections.taken.tables.less.values = DataService.generateDataTable(data.l);
    $scope.hits = DataService.generateHitObject(data.h) || $scope.hits;
    $scope.resistance = data.t;
  }

  // Load data from URL
  var data = window.location.search;
  if (data) {
    data = LZString.decompressFromEncodedURIComponent(data.substring(1));
    data = rison.decode(data);
    loadUrlData(data)
  }

  // Add empty last row to tables
  Object.keys($scope.sections).forEach(function (sectionKey) {
    var section = $scope.sections[sectionKey];
    Object.keys(section.tables).forEach(function (tableKey) {
      var table = section.tables[tableKey];
      table.values = table.values || [];
      $scope.add(table, true);
    });
  });

  $scope.updateHits(true);

  window.onpopstate = function () {
    window.location.reload();
  }
});
