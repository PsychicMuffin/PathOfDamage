angular.module('PathOfDamage')
.service('DataService', function () {
  var VALUE_DELIMITER = '\r';
  var ROW_DELIMITER = '\f';
  var SECTION_DELIMITER = '\0';
  var ELEMENTS = ['fire', 'cold', 'lightning', 'chaos'];

  function parseIntOrNull(string) {
    var int = parseInt(string);
    return isNaN(int) ? null : int;
  }

  function checkTotal(table) {
    if (table.totalMin) {
      table.total = Math.max(table.total, table.totalMin);
    }
    if (table.totalMax) {
      table.total = Math.min(table.total, table.totalMax);
    }
  }

  return {
    getSections: function () {
      return {
        mitigation: {
          name: "Damage Mitigation",
          description: "Elemental and chaos damage is mitigated by its respective resistance. Physical damage is mitigated by the sum of all '% additional Physical Damage Reduction' modifiers, up to its 90% cap. This includes armor, endurance charges, and things like Basalt Flasks and Chaos Golem.",
          healthPool: 5000,
          armor: 0,
          charges: 0,
          resistance: {
            fire: 75,
            cold: 75,
            lightning: 75,
            chaos: -60
          },
          tables: {
            reduction: {
              totalName: "Additional Physical Damage Reduction",
              totalMax: 90
            }
          }
        },
        taken: {
          name: "Damage Taken",
          description: "After damage mitigation, modifiers to damage taken are applied. Flat amounts (±X Damage taken from Y, like Astramentis) are applied first, then the sum of all increases/reductions (% increased/reduced X Damage taken, like Fortify, Shock, and Abyssus) and lastly more/less multipliers (% more/less X Damage taken, like Arctic Armour).",
          tables: {
            flat: {
              totalName: "Flat Increase"
            },
            increased: {
              totalName: "Increased Damage Taken",
              totalMin: -100
            },
            more: {
              totalName: "More Damage Taken",
              totalMin: -100,
              totalCalc: this.multiplicative
            }
          }
        },
        shift: {
          name: "Damage Shifts",
          description: "Modifiers that shift physical damage to elemental, typically reading like '% of Physical Damage taken as Y', such as Taste of Hate or Lightning Coil",
          tables: {
            shifts: {
              totalName: "Damage Shifted",
              totalMin: 0,
              totalMax: 100
            }
          }
        },
        monster: {
          name: "Monster Modifications",
          description: "These are things that directly change a monster's damage before they attack, such as map mods or curses",
          tables: {
            increase: {
              totalName: "Increased Monster Damage",
              totalMin: -100
            },
            more: {
              totalName: "More Monster Damage",
              totalMin: -100,
              totalCalc: this.multiplicative
            }
          }
        }
      };
    },
    additive: function () {
      this.total = 0;
      for (var i = 0; i < this.values.length - 1; i++) {
        if (this.values[i].enabled && this.values[i].value) {
          this.total += this.values[i].value;
        }
      }
      checkTotal(this);
    },
    multiplicative: function () {
      this.total = 100;
      for (var i = 0; i < this.values.length - 1; i++) {
        if (this.values[i].enabled && this.values[i].value) {
          this.total *= (1 + this.values[i].value / 100);
        }
      }
      this.total -= 100;
      checkTotal(this);
    },
    encodeData: function (scope) {
      var dataString = '';
      dataString += this.encodeTable(scope.sections.monster.tables.increase.values);
      dataString += this.encodeTable(scope.sections.monster.tables.more.values);
      dataString += this.encodeTable(scope.sections.shift.tables.shifts.values);
      dataString += this.encodeTable(scope.sections.mitigation.tables.reduction.values);
      dataString += this.encodeTable(scope.sections.taken.tables.flat.values);
      dataString += this.encodeTable(scope.sections.taken.tables.increased.values);
      dataString += this.encodeTable(scope.sections.taken.tables.more.values);
      scope.hits.slice(0, -1).map(function (hit, index, array) {
        var delimiter = index === array.length - 1 ? SECTION_DELIMITER : ROW_DELIMITER;
        dataString += hit.hit + delimiter;
      });
      dataString += scope.sections.mitigation.armor + SECTION_DELIMITER;
      dataString += scope.sections.mitigation.charges + SECTION_DELIMITER;
      dataString += scope.sections.mitigation.resistance.fire + SECTION_DELIMITER;
      dataString += scope.sections.mitigation.resistance.cold + SECTION_DELIMITER;
      dataString += scope.sections.mitigation.resistance.lightning + SECTION_DELIMITER;
      dataString += scope.sections.mitigation.resistance.chaos + SECTION_DELIMITER;
      dataString += scope.sections.mitigation.healthPool;
      return dataString;
    },
    encodeTable: function (table) {
      var tableData = '';
      for (var i = 0; i < table.length - 1; i++) {
        tableData += +table[i].enabled;
        if (table[i].name) {
          tableData += table[i].name;
        }
        tableData += VALUE_DELIMITER;
        if (table[i].value) {
          tableData += table[i].value;
        }
        if (table[i].element) {
          tableData += VALUE_DELIMITER;
          tableData += ELEMENTS.indexOf(table[i].element);
        }
        if (i !== table.length - 2) {
          tableData += ROW_DELIMITER;
        }
      }
      return tableData + SECTION_DELIMITER;
    },
    decodeData: function (scope, dataString) {
      var sections = dataString.split(SECTION_DELIMITER);
      scope.sections.monster.tables.increase.values = this.decodeTable(sections[0]);
      scope.sections.monster.tables.more.values = this.decodeTable(sections[1]);
      scope.sections.shift.tables.shifts.values = this.decodeTable(sections[2]);
      scope.sections.mitigation.tables.reduction.values = this.decodeTable(sections[3]);
      scope.sections.taken.tables.flat.values = this.decodeTable(sections[4]);
      scope.sections.taken.tables.increased.values = this.decodeTable(sections[5]);
      scope.sections.taken.tables.more.values = this.decodeTable(sections[6]);
      scope.hits = sections[7].split(ROW_DELIMITER).map(function (hit) {
        return {hit: parseIntOrNull(hit)};
      });
      scope.sections.mitigation.armor = parseIntOrNull(sections[8]);
      scope.sections.mitigation.charges = parseIntOrNull(sections[9]);
      scope.sections.mitigation.resistance.fire = parseIntOrNull(sections[10]);
      scope.sections.mitigation.resistance.cold = parseIntOrNull(sections[11]);
      scope.sections.mitigation.resistance.lightning = parseIntOrNull(sections[12]);
      scope.sections.mitigation.resistance.chaos = parseIntOrNull(sections[13]);
      scope.sections.mitigation.healthPool = parseIntOrNull(sections[14]);
    },
    decodeTable: function (tableString) {
      if (tableString) {
        var table = [];
        var rows = tableString.split(ROW_DELIMITER);
        for (var i = 0; i < rows.length; i++) {
          var values = rows[i].split(VALUE_DELIMITER);
          var tableEntry = {
            enabled: !!values[0].slice(0, 1),
            name: values[0].slice(1),
            value: parseIntOrNull(values[1])
          };
          if (values[2]) {
            tableEntry.element = ELEMENTS[values[2]];
          }
          table.push(tableEntry);
        }
        return table;
      }
    }
  };
});