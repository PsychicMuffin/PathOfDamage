angular.module('PathOfDamage')
.service('DataService', function () {
  var VALUE_DELIMITER = '\r';
  var ROW_DELIMITER = '\f';
  var SECTION_DELIMITER = '\0';

  function parseIntOrNull(string) {
    var int = parseInt(string);
    return isNaN(int) ? null : int;
  }
  
  function Row(key, value) {
    this.enabled = true;
    this.name = '';
    this.value = null;
    if (key !== undefined) {
      this[key] = value;
    }
    this.isEnabled = function () {
      return this.enabled && this.value;
    }
  }

  function Table(name, addToTotal, key, value) {
    this.name = name;
    this.rows = [];
    this.calcTotals = function () {
      this.totals = this.getEmptyTotal();
      for (var i = 0, len = this.rows.length - 1; i < len; i++) {
        if (this.rows[i].isEnabled()) {
          addToTotal(this.totals, this.rows[i]);
        }
      }
    };
    this.addRow = function () {
      this.rows.push(new Row(key, value));
    };
    this.getEmptyTotal = function () {
      return {total: 0};
    }
  }

  function TypedTable(name, addToSubtotal) {
    Table.call(this, name, function (totals, row) {
      for (var i = 0, len = row.types.length; i < len; i++) {
        addToSubtotal(totals, row.value, row.types[i]);
      }
    }, 'types', ['physical']);
    this.getEmptyTotal = function () {
      return {};
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
            reduction: new Table("Additional Physical Damage Reduction", function (totals, value) {
              totals.total = Math.min(totals.total + value.value, 90);
            })
          }
        },
        taken: {
          name: "Damage Taken",
          description: "After damage mitigation, modifiers to damage taken are applied. Flat amounts (±X Damage taken from Y, like Astramentis) are applied first, then the sum of all increases/reductions (% increased/reduced X Damage taken, like Fortify, Shock, and Abyssus) and lastly more/less multipliers (% more/less X Damage taken, like Arctic Armour).",
          tables: {
            flat: new TypedTable("Flat Increase", function (totals, value, type) {
              totals[type] = totals[type] + value || value;
            }),
            increased: new TypedTable("Increased Damage Taken", function (totals, value, type) {
              totals[type] = Math.max(totals[type] + value || value, -100);
            }),
            more: new TypedTable("More Damage Taken", function (totals, value, type) {
              var multiplier = 1 + value / 100;
              var newTotal = (totals[type] + 100) * multiplier - 100;
              totals[type] = Math.max(newTotal || value, -100);
            })
          }
        },
        shift: {
          name: "Damage Shifts",
          description: "Modifiers that shift physical damage to elemental, typically reading like '% of Physical Damage taken as Y', such as Taste of Hate or Lightning Coil",
          tables: {
            shifts: new Table("Damage Shifted", function (totals, value) {
              totals[value.element] = totals[value.element] + value.value || value.value;
              totals.total += value.value;
            }, 'element', 'fire')
          }
        },
        monster: {
          name: "Monster Modifications",
          description: "These are things that directly change a monster's damage before they attack, such as map mods or curses",
          tables: {
            increase: new Table("Increased Monster Damage", function (totals, value) {
              totals.total = Math.max(totals.total + value.value, -100);
            }),
            more: new Table("More Monster Damage", function (totals, value) {
              var multiplier = 1 + value.value / 100;
              var newTotal = (totals.total + 100) * multiplier - 100;
              totals.total = Math.max(newTotal, -100);
            })
          }
        }
      };
    },
    encodeData: function (scope) {
      var dataString = '';
      dataString += this.encodeTable(scope.sections.monster.tables.increase.rows, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.monster.tables.more.rows, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.shift.tables.shifts.rows, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.mitigation.tables.reduction.rows, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.taken.tables.flat.rows, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.taken.tables.increased.rows, scope.DAMAGE_TYPES);
      dataString += this.encodeTable(scope.sections.taken.tables.more.rows, scope.DAMAGE_TYPES);
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
      scope.sections.monster.tables.increase.rows = this.decodeTable(sections[0], scope.DAMAGE_TYPES);
      scope.sections.monster.tables.more.rows = this.decodeTable(sections[1], scope.DAMAGE_TYPES);
      scope.sections.shift.tables.shifts.rows = this.decodeTable(sections[2], scope.DAMAGE_TYPES, this.decodeElement);
      scope.sections.mitigation.tables.reduction.rows = this.decodeTable(sections[3], scope.DAMAGE_TYPES);
      scope.sections.taken.tables.flat.rows = this.decodeTable(sections[4], scope.DAMAGE_TYPES, this.decodeTypes);
      scope.sections.taken.tables.increased.rows = this.decodeTable(sections[5], scope.DAMAGE_TYPES, this.decodeTypes);
      scope.sections.taken.tables.more.rows = this.decodeTable(sections[6], scope.DAMAGE_TYPES, this.decodeTypes);
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
      if (!tableString) {
        return [];
      }
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