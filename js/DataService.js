angular.module('PathOfDamage')
.service('DataService', function () {
  const ELEMENTS = ['physical', 'fire', 'cold', 'lightning', 'chaos'];
  const VALUE_DELIMITER = '\r';
  const ROW_DELIMITER = '\f';
  const SECTION_DELIMITER = '\0';

  function Row(enabled, name, value, elements) {
    this.enabled = enabled || true;
    this.name = name || '';
    this.value = value || null;
    this.elements = elements;
    this.isValid = function () {
      return this.enabled && this.value;
    }
  }

  function Table(name, updateTotals, defaultElements) {
    this.name = name;
    this.defaultElements = defaultElements;
    this.rows = [];
    this.calcTotals = function () {
      var totals = this.getEmptyTotals();
      this.rows.forEach(function (row) {
        if (row.isValid()) {
          updateTotals(totals, row);
        }
      });
      this.totals = totals;
    };
    this.addRow = function (enabled, name, value, elements) {
      this.rows.push(new Row(enabled, name, value, elements || this.getDefaultElements()));
    };
    this.getDefaultElements = function () {
      return this.defaultElements ? Object.assign({}, defaultElements) : undefined;
    };
    this.getEmptyTotals = function () {
      return {total: 0};
    }
  }

  function TypedTable(name, updateTotals, defaultElements) {
    Table.call(this, name, function (totals, row) {
      Object.keys(row.elements).forEach(function (element) {
        if (row.elements[element]) {
          updateTotals(totals, row.value, element);
        }
      });
    }, defaultElements || {physical: true, fire: false, cold: false, lightning: false, chaos: false});
    this.getEmptyTotals = function () {
      return {physical: 0, fire: 0, cold: 0, lightning: 0, chaos: 0};
    }
  }

  function MonsterIncreaseTable() {
    Table.call(this, "Increased Monster Damage", function (totals, row) {
      totals.total = Math.max(totals.total + row.value, -100);
    });
  }

  function MonsterMoreTable() {
    Table.call(this, "More Monster Damage", function (totals, row) {
      var multiplier = 1 + row.value / 100;
      var newTotal = (totals.total + 100) * multiplier - 100;
      totals.total = Math.max(newTotal, -100);
    });
  }

  function DamageShiftTable() {
    Table.call(this, "Damage Shifted", function (totals, row) {
      Object.keys(row.elements).forEach(function (element) {
        if (row.elements[element]) {
          totals[element] = totals[element] + row.value;
          totals.total += row.value;
        }
      });
    }, {physical: false, fire: true, cold: false, lightning: false, chaos: false});
    this.getEmptyTotals = function () {
      return {total: 0, fire: 0, cold: 0, lightning: 0, chaos: 0};
    }
  }

  function DamageFromManaTable() {
    TypedTable.call(this, "Damage Taken From Mana Before Life", function (totals, value, element) {
      totals[element] = Math.max(totals[element] + value, 0);
    }, {physical: true, fire: true, cold: true, lightning: true, chaos: true})
  }

  function DamageReductionTable() {
    Table.call(this, "Additional Physical Damage Reduction", function (totals, row) {
      totals.total = Math.min(totals.total + row.value, 90);
    });
  }

  function FlatTakenTable() {
    TypedTable.call(this, "Flat Increase", function (totals, value, element) {
      totals[element] = totals[element] + value;
    });
  }

  function IncreasedTakenTable() {
    TypedTable.call(this, "Increased Damage Taken", function (totals, value, element) {
      totals[element] = Math.max(totals[element] + value, -100);
    });
  }

  function MoreTakenTable() {
    TypedTable.call(this, "More Damage Taken", function (totals, value, element) {
      var multiplier = 1 + value / 100;
      var newTotal = (totals[element] + 100) * multiplier - 100;
      totals[element] = Math.max(newTotal, -100);
    });
  }

  return {
    getSections: function () {
      return {
        mitigation: {
          name: "Damage Mitigation",
          description: "Elemental and chaos damage is mitigated by its respective resistance. Physical damage is mitigated by the sum of all '% additional Physical Damage Reduction' modifiers, up to its 90% cap. This includes armor, endurance charges, and things like Basalt Flasks and Chaos Golem.",
          healthPool: 5000,
          manaPool: 1000,
          armor: 0,
          charges: 0,
          resistance: {
            fire: 75,
            cold: 75,
            lightning: 75,
            chaos: -60
          },
          tables: {
            reduction: new DamageReductionTable()
          }
        },
        taken: {
          name: "Damage Taken",
          description: "After damage mitigation, modifiers to damage taken are applied. Flat amounts (±X Damage taken from Y, like Astramentis) are applied first, then the sum of all increases/reductions (% increased/reduced X Damage taken, like Fortify, Shock, and Abyssus) and lastly more/less multipliers (% more/less X Damage taken, like Arctic Armour).",
          tables: {
            flat: new FlatTakenTable(),
            increased: new IncreasedTakenTable(),
            more: new MoreTakenTable()
          }
        },
        shift: {
          name: "Damage Shifts",
          description: "Modifiers that shift physical damage to elemental, typically reading like '% of Physical Damage taken as Y', such as Taste of Hate or Lightning Coil. Additionally, damage can be taken from mana like Mind over Matter.",
          tables: {
            shifts: new DamageShiftTable(),
            mana: new DamageFromManaTable()
          }
        },
        monster: {
          name: "Monster Modifications",
          description: "These are things that directly change a monster's damage before they attack, such as map mods or curses",
          tables: {
            increase: new MonsterIncreaseTable(),
            more: new MonsterMoreTable()
          }
        }
      };
    },
    encodeData: function (scope) {
      var dataString = '';
      dataString += encodeTable(scope.sections.monster.tables.increase.rows);
      dataString += encodeTable(scope.sections.monster.tables.more.rows);
      dataString += encodeTable(scope.sections.shift.tables.shifts.rows);
      dataString += encodeTable(scope.sections.shift.tables.mana.rows);
      dataString += encodeTable(scope.sections.mitigation.tables.reduction.rows);
      dataString += encodeTable(scope.sections.taken.tables.flat.rows);
      dataString += encodeTable(scope.sections.taken.tables.increased.rows);
      dataString += encodeTable(scope.sections.taken.tables.more.rows);
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
      dataString += scope.sections.mitigation.healthPool + SECTION_DELIMITER;
      dataString += scope.sections.mitigation.manaPool;
      return dataString;
    },
    decodeData: function (scope, dataString) {
      var i = 0;
      var sections = dataString.split(SECTION_DELIMITER);
      decodeTable(scope.sections.monster.tables.increase, sections[i++]);
      decodeTable(scope.sections.monster.tables.more, sections[i++]);
      decodeTable(scope.sections.shift.tables.shifts, sections[i++]);
      decodeTable(scope.sections.shift.tables.mana, sections[i++]);
      decodeTable(scope.sections.mitigation.tables.reduction, sections[i++]);
      decodeTable(scope.sections.taken.tables.flat, sections[i++]);
      decodeTable(scope.sections.taken.tables.increased, sections[i++]);
      decodeTable(scope.sections.taken.tables.more, sections[i++]);
      scope.hits = sections[i++].split(ROW_DELIMITER).map(function (hit) {
        return {hit: parseIntOrNull(hit)};
      });
      scope.sections.mitigation.armor = parseIntOrNull(sections[i++]);
      scope.sections.mitigation.charges = parseIntOrNull(sections[i++]);
      scope.sections.mitigation.resistance.fire = parseIntOrNull(sections[i++]);
      scope.sections.mitigation.resistance.cold = parseIntOrNull(sections[i++]);
      scope.sections.mitigation.resistance.lightning = parseIntOrNull(sections[i++]);
      scope.sections.mitigation.resistance.chaos = parseIntOrNull(sections[i++]);
      scope.sections.mitigation.healthPool = parseIntOrNull(sections[i++]);
      scope.sections.mitigation.manaPool = parseIntOrNull(sections[i]);
    }
  };

  function encodeTable(table) {
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
      if (table[i].elements) {
        tableData += VALUE_DELIMITER;
        tableData += encodeElements(table[i].elements);
      }
      if (i !== table.length - 2) {
        tableData += ROW_DELIMITER;
      }
    }
    return tableData + SECTION_DELIMITER;
  }

  function encodeElements(elements) {
    var encoded = '';
    ELEMENTS.forEach(function (element) {
      encoded += +(elements[element]);
    });
    return parseInt(encoded, 2).toString(36);
  }

  function decodeTable(table, tableString) {
    if (tableString) {
      var rows = tableString.split(ROW_DELIMITER);
      for (var i = 0; i < rows.length; i++) {
        var values = rows[i].split(VALUE_DELIMITER);
        table.addRow(
            values[0].slice(0, 1) === '1',
            values[0].slice(1),
            parseIntOrNull(values[1]),
            decodeElements(values[2])
        );
      }
    }
  }

  function decodeElements(encodedElements) {
    if (encodedElements) {
      var elements = [];
      var booleans = parseInt(encodedElements, 36).toString(2).split('');
      var index = booleans.length;
      for (var i = ELEMENTS.length; i-- > 0;) {
        elements[ELEMENTS[i]] = booleans[--index] === '1';
      }
      return elements;
    }
  }

  function parseIntOrNull(string) {
    var int = parseInt(string);
    return isNaN(int) ? null : int;
  }
});