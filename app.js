var app = angular.module('PathOfDamage', []);
app.controller('Damage', function ($scope) {
  var data = new URLSearchParams(window.location.search).get("data");

  if (data) {
    data = decodeURIComponent(data);
    data = JSON.parse(data);
    console.log(data);
    $scope.damageDefaults = data.hits;
  }

  $scope.sections = {
    monster: {
      name: "Monster Modifications",
      description: "These are things that directly change a monster's damage before they attack, such as map mods or curses",
      tables: {
        increase: {
          placeholder: "Increased Damage",
          totalName: "Increased Monster Damage",
          total: 0
        },
        more: {
          placeholder: "More Damage"
        }
      }
    },
    shift: {
      name: "Damage Shifts",
      description: "Modifiers that shift physical damage to elemental, typically reading like '% of Physical Damage taken as Y', such as Taste of Hate or Lightning Coil",
      tables: {
        shifts: {
          placeholder: "Shift Source",
          totalName: "Damage Shifted",
          total: 0
        }
      }
    },
    mitigation: {
      name: "Damage Mitigation",
      description: "Elemental and chaos damage is mitigated by its respective resistance. Physical damage is mitigated by the sum of all '% additional Physical Damage Reduction' modifiers, up to its 90% cap. This includes armor, endurance charges, and things like Basalt Flasks and Chaos Golem.",
      armor: null,
      charges: null,
      tables: {
        reduction: {
          placeholder: "Reduction Name",
          totalName: "Additional Physical Damage Reduction",
          total: 0
        }
      }
    },
    taken: {
      name: "Damage Taken",
      description: "After damage mitigation, modifiers to damage taken are applied. Flat amounts (±X Damage taken from Y, like Astramentis) are applied first, then the sum of all increases/reductions (% increased/reduced X Damage taken, like Fortify, Shock, and Abyssus) and lastly more/less multipliers (% more/less X Damage taken, like Arctic Armour).",
      tables: {
        flat: {
          placeholder: "Flat Reduction",
          totalName: "Flat Reduction",
          total: 0
        },
        reduced: {
          placeholder: "Reduced Taken",
          totalName: "Reduced Damage Taken",
          total: 0
        },
        less: {
          placeholder: "Less Taken"
        }
      }
    }
  };

  if ($scope.damageDefaults === null) {
    $scope.damageDefaults = [100, 500, 1000, 2000, 3000, 4000, 5000, 7500, 10000, null, null];
  }

  $scope.hits = [];
  for (var i = 0; i < $scope.damageDefaults.length; i++) {
    $scope.hits.push({
      damage: $scope.damageDefaults[i],
      id: "hit" + i
    });
  }

  $scope.resistance = 75;

  // Initialize all the tables
  Object.keys($scope.sections).forEach(function (sectionKey) {
    var section = $scope.sections[sectionKey];
    Object.keys(section.tables).forEach(function (tableKey) {
      section.tables[tableKey].values = [{
        enabled: true,
        name: "",
        value: null
      }];
    });
  });

  $scope.add = function (table) {
    var lastEntry = table.values[table.values.length - 1];
    if (lastEntry.name !== "" || lastEntry.value !== null) {
      table.values.push({
        enabled: true,
        name: "",
        value: null
      });
    }
    $scope.updateTotal(table);
  };

  $scope.delete = function (table, index) {
    table.values.splice(index, 1);
    $scope.updateTotal(table);
  };

  $scope.updateTotal = function (table) {
    if (table.total !== undefined) {
      table.total = 0;
      for (var i = 0; i < table.values.length - 1; i++) {
        if (table.values[i].enabled && !isNaN(table.values[i].value)) {
          table.total += table.values[i].value;
        }
      }
    }
    $scope.stringifyUrlData();
  };

  $scope.calcDamage = function (hit) {
    if (hit === null || hit === 0) {
      return "0 (0)";
    }

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

    return Math.round(hit) + " (" + Math.round(shifted) + ")";
  };

  $scope.stringifyUrlData = function () {
    var hits = [];
    for (var i = 0; i < $scope.hits.length; i++) {
      hits.push($scope.hits[i].damage);
    }
    var data = {
      hits: hits
    };
    var stringified = JSON.stringify(data);
    window.history.replaceState({}, "", "?data=" + stringified)
  };
});
