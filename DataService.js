angular.module('PathOfDamage')
.service('DataService', function () {
  var NAME_DELIMITER = '\r';
  var ROW_DELIMITER = '\f';
  var SECTION_DELIMITER = '\0';

  function parseIntOrNull(string) {
    var int = parseInt(string);
    return isNaN(int) ? null : int;
  }

  return {
    getSections: function () {
      return {
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
          armor: 0,
          charges: 0,
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
    },
    encodeData: function (scope) {
      var dataString = '';
      dataString += this.encodeTable(scope.sections.monster.tables.increase.values);
      dataString += this.encodeTable(scope.sections.monster.tables.more.values);
      dataString += this.encodeTable(scope.sections.shift.tables.shifts.values);
      dataString += this.encodeTable(scope.sections.mitigation.tables.reduction.values);
      dataString += this.encodeTable(scope.sections.taken.tables.flat.values);
      dataString += this.encodeTable(scope.sections.taken.tables.reduced.values);
      dataString += this.encodeTable(scope.sections.taken.tables.less.values);
      scope.hits.slice(0, -1).map(function (hit, index, array) {
        var delimiter = index === array.length - 1 ? SECTION_DELIMITER : ROW_DELIMITER;
        dataString += hit.hit + delimiter;
      });
      dataString += scope.sections.mitigation.armor + SECTION_DELIMITER;
      dataString += scope.sections.mitigation.charges + SECTION_DELIMITER;
      dataString += scope.resistance + SECTION_DELIMITER;
      dataString += scope.healthPool;
      return dataString;
    },
    encodeTable: function (table) {
      var tableData = '';
      for (var i = 0; i < table.length - 1; i++) {
        tableData += +table[i].enabled;
        if (table[i].name) {
          tableData += table[i].name;
          tableData += NAME_DELIMITER;
        }
        if (table[i].value) {
          tableData += table[i].value;
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
      scope.sections.taken.tables.reduced.values = this.decodeTable(sections[5]);
      scope.sections.taken.tables.less.values = this.decodeTable(sections[6]);
      scope.hits = sections[7].split(ROW_DELIMITER).map(function (hit) {
        return {hit: parseIntOrNull(hit)};
      });
      scope.sections.mitigation.armor = parseIntOrNull(sections[8]);
      scope.sections.mitigation.charges = parseIntOrNull(sections[9]);
      scope.resistance = parseIntOrNull(sections[10]);
      scope.healthPool = parseIntOrNull(sections[11]);
    },
    decodeTable: function (tableString) {
      if (tableString) {
        var rows = tableString.split(ROW_DELIMITER);
        var table = [];
        for (var i = 0; i < rows.length; i++) {
          var valueIndex = rows[i].indexOf(NAME_DELIMITER);
          if (valueIndex > -1) {
            table.push({
              enabled: !!rows[i].slice(0, 1),
              name: rows[i].slice(1, valueIndex),
              value: parseIntOrNull(rows[i].slice(valueIndex + 1))
            });
          } else {
            table.push({
              enabled: !!rows[i].slice(0, 1),
              name: '',
              value: parseIntOrNull(rows[i].slice(1))
            });
          }
        }
        return table;
      }
    }
  };
});