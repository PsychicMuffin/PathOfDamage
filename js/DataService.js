angular.module('PathOfDamage')
.service('DataService', function () {
  const VALUE_DELIMITER = '\r';
  const ROW_DELIMITER = '\f';
  const SECTION_DELIMITER = '\0';

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
              name: "Additional Physical Damage Reduction",
              totalMax: 90
            }
          }
        },
        taken: {
          name: "Damage Taken",
          description: "After damage mitigation, modifiers to damage taken are applied. Flat amounts (±X Damage taken from Y, like Astramentis) are applied first, then the sum of all increases/reductions (% increased/reduced X Damage taken, like Fortify, Shock, and Abyssus) and lastly more/less multipliers (% more/less X Damage taken, like Arctic Armour).",
          tables: {
            flat: {
              name: "Flat Increase",
              calcTotal: function () {
                var subTotals = {};
                this.values.forEach(function (flat) {
                  if (flat.enabled && flat.value && flat.types) {
                    flat.types.forEach(function (type) {
                      subTotals[type] = subTotals[type] + flat.value || flat.value;
                    });
                  }
                });
                this.subTotals = subTotals;
              },
              getTotal: function () {
                return this.subTotals.physical || 0;
              }
            },
            increased: {
              name: "Increased Damage Taken",
              calcTotal: function () {
                var subTotals = {};
                this.values.forEach(function (increased) {
                  if (increased.enabled && increased.value && increased.types) {
                    increased.types.forEach(function (type) {
                      subTotals[type] = Math.max(subTotals[type] + increased.value || increased.value, -100);
                    });
                  }
                });
                this.subTotals = subTotals;
              },
              getTotal: function () {
                return this.subTotals.physical || 0;
              }
            },
            more: {
              name: "More Damage Taken",
              calcTotal: function () {
                var subTotals = {};
                this.values.forEach(function (more) {
                  if (more.enabled && more.value && more.types) {
                    more.types.forEach(function (type) {
                      var multiplier = 1 + more.value / 100;
                      var newTotal = (subTotals[type] + 100) * multiplier - 100;
                      subTotals[type] = Math.max(newTotal || more.value, -100);
                    });
                  }
                });
                this.subTotals = subTotals;
              },
              getTotal: function () {
                return this.subTotals.physical || 0;
              }
            }
          }
        },
        shift: {
          name: "Damage Shifts",
          description: "Modifiers that shift physical damage to elemental, typically reading like '% of Physical Damage taken as Y', such as Taste of Hate or Lightning Coil",
          tables: {
            shifts: {
              name: "Damage Shifted",
              calcTotal: function () {
                var subTotals = {};
                var total = 0;
                this.values.forEach(function (shift) {
                  if (shift.enabled && shift.value && shift.element) {
                    subTotals[shift.element] = subTotals[shift.element] + shift.value || shift.value;
                    total += shift.value;
                  }
                });
                this.subTotals = subTotals;
                this.total = total;
              }
            }
          }
        },
        monster: {
          name: "Monster Modifications",
          description: "These are things that directly change a monster's damage before they attack, such as map mods or curses",
          tables: {
            increase: {
              name: "Increased Monster Damage",
              totalMin: -100
            },
            more: {
              name: "More Monster Damage",
              totalMin: -100,
              calcTotal: this.multiplicativeTotal
            }
          }
        }
      };
    },
    additiveTotal: function () {
      this.total = 0;
      for (var i = 0; i < this.values.length - 1; i++) {
        if (this.values[i].enabled && this.values[i].value) {
          this.total += this.values[i].value;
        }
      }
      checkTotal(this);
    },
    multiplicativeTotal: function () {
      this.total = 100;
      for (var i = 0; i < this.values.length - 1; i++) {
        if (this.values[i].enabled && this.values[i].value) {
          this.total *= (1 + this.values[i].value / 100);
        }
      }
      this.total -= 100;
      checkTotal(this);
    },
    getTotal: function () {
      return this.total;
    },
    encodeData: function (scope) {
      var dataString = '';
      dataString += this.encodeTable(scope.sections.monster.tables.increase.values, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.monster.tables.more.values, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.shift.tables.shifts.values, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.mitigation.tables.reduction.values, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.taken.tables.flat.values, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.taken.tables.increased.values, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.taken.tables.more.values, scope.DAMAGE_TYPES);
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
    encodeTable: function (table, damageTypes) {
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
          tableData += damageTypes.indexOf(table[i].element);
        } else if (table[i].types) {
          tableData += VALUE_DELIMITER;
          tableData += this.encodeTypes(table[i].types, damageTypes);
        }
        if (i !== table.length - 2) {
          tableData += ROW_DELIMITER;
        }
      }
      return tableData + SECTION_DELIMITER;
    },
    encodeTypes: function (types, damageTypes) {
      var encoded = '';
      damageTypes.forEach(function (type) {
        encoded += +types.includes(type);
      });
      return parseInt(encoded, 2).toString(36);
    },
    decodeData: function (scope, dataString) {
      var sections = dataString.split(SECTION_DELIMITER);
      scope.sections.monster.tables.increase.values = this.decodeTable(sections[0], scope.DAMAGE_TYPES);
      scope.sections.monster.tables.more.values = this.decodeTable(sections[1], scope.DAMAGE_TYPES);
      scope.sections.shift.tables.shifts.values = this.decodeTable(sections[2], scope.DAMAGE_TYPES, this.decodeElement);
      scope.sections.mitigation.tables.reduction.values = this.decodeTable(sections[3], scope.DAMAGE_TYPES);
      scope.sections.taken.tables.flat.values = this.decodeTable(sections[4], scope.DAMAGE_TYPES, this.decodeTypes);
      scope.sections.taken.tables.increased.values = this.decodeTable(sections[5], scope.DAMAGE_TYPES, this.decodeTypes);
      scope.sections.taken.tables.more.values = this.decodeTable(sections[6], scope.DAMAGE_TYPES, this.decodeTypes);
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
    decodeTable: function (tableString, damageTypes, extraParsing) {
      if (tableString) {
        var table = [];
        var rows = tableString.split(ROW_DELIMITER);
        for (var i = 0; i < rows.length; i++) {
          var values = rows[i].split(VALUE_DELIMITER);
          var tableEntry = {
            enabled: values[0].slice(0, 1) === '1',
            name: values[0].slice(1),
            value: parseIntOrNull(values[1])
          };
          if (extraParsing) {
            extraParsing(values, tableEntry, damageTypes);
          }
          table.push(tableEntry);
        }
        return table;
      }
    },
    decodeElement: function (values, tableEntry, damageTypes) {
      if (values[2]) {
        tableEntry.element = damageTypes[values[2]];
      }
    },
    decodeTypes: function (values, tableEntry, damageTypes) {
      if (values[2]) {
        var types = [];
        var booleans = parseInt(values[2], 36).toString(2).split('');
        var index = booleans.length;
        for (var i = damageTypes.length; i-- > 0;) {
          if (booleans[--index] === '1') {
            types.push(damageTypes[i]);
          }
        }
        tableEntry.types = types;
      }
    }
  };
});