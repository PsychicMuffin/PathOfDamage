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
    this.quickAddRow = function (name, value, elements) {
      this.rows[this.rows.length - 1] = new Row(true, name, value, elements);
      this.addRow();
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
    getMitigation: function () {
      return {
        name: "Damage Mitigation",
        description: "Elemental and chaos damage is mitigated by its respective resistance. Physical damage is mitigated by the sum of all '% additional Physical Damage Reduction' modifiers, up to its 90% cap. This includes armor, endurance charges, and things like Basalt Flasks and Chaos Golem.",
        health: 5000,
        es: 0,
        mana: 1000,
        armor: 0,
        charges: 0,
        resistance: {
          fire: 75,
          cold: 75,
          lightning: 75,
          chaos: -60
        },
        chaosImmune: false,
        chaosBlocked: false,
        tables: {
          reduction: new DamageReductionTable()
        }
      }
    },
    getDamageTaken: function () {
      return {
        name: "Damage Taken",
        description: "After damage mitigation, modifiers to damage taken are applied. Flat amounts (±X Damage taken from Y, like Astramentis) are applied first, then the sum of all increases/reductions (% increased/reduced X Damage taken, like Fortify, Shock, and Abyssus) and lastly more/less multipliers (% more/less X Damage taken, like Arctic Armour).",
        tables: {
          flat: new FlatTakenTable(),
          increased: new IncreasedTakenTable(),
          more: new MoreTakenTable()
        }
      }
    },
    getShifts: function () {
      return {
        name: "Damage Shifts",
        description: "Modifiers that shift physical damage to elemental, typically reading like '% of Physical Damage taken as Y', such as Taste of Hate or Lightning Coil. Additionally, damage can be taken from mana like Mind over Matter.",
        tables: {
          shifts: new DamageShiftTable(),
          mana: new DamageFromManaTable()
        }
      }
    },
    getMonsterMods: function () {
      return {
        name: "Monster Modifications",
        description: "These are things that directly change a monster's damage before they attack, such as map mods or curses",
        tables: {
          increase: new MonsterIncreaseTable(),
          more: new MonsterMoreTable()
        }
      }
    },
    getHits: function () {
      return [
        {hit: 100},
        {hit: 500},
        {hit: 1000},
        {hit: 2000},
        {hit: 3000},
        {hit: 5000},
        {hit: 7500},
        {hit: 10000}
      ];
    },
    encodeData: function (mitigation, taken, shift, monster, hits) {
      var dataString = '';
      dataString += encodeTable(monster.tables.increase.rows);
      dataString += encodeTable(monster.tables.more.rows);
      dataString += encodeTable(shift.tables.shifts.rows);
      dataString += encodeTable(shift.tables.mana.rows);
      dataString += encodeTable(mitigation.tables.reduction.rows);
      dataString += encodeTable(taken.tables.flat.rows);
      dataString += encodeTable(taken.tables.increased.rows);
      dataString += encodeTable(taken.tables.more.rows);
      hits.slice(0, -1).map(function (hit, index, array) {
        var delimiter = index === array.length - 1 ? SECTION_DELIMITER : ROW_DELIMITER;
        dataString += hit.hit + delimiter;
      });
      dataString += mitigation.armor + SECTION_DELIMITER;
      dataString += mitigation.charges + SECTION_DELIMITER;
      dataString += mitigation.resistance.fire + SECTION_DELIMITER;
      dataString += mitigation.resistance.cold + SECTION_DELIMITER;
      dataString += mitigation.resistance.lightning + SECTION_DELIMITER;
      dataString += mitigation.resistance.chaos + SECTION_DELIMITER;
      dataString += mitigation.health + SECTION_DELIMITER;
      dataString += mitigation.es + SECTION_DELIMITER;
      dataString += mitigation.mana + SECTION_DELIMITER;
      dataString += encodeBooleans([mitigation.chaosBlocked, mitigation.chaosImmune]);
      return dataString;
    },
    decodeData: function (scope, dataString) {
      var i = 0;
      var sections = dataString.split(SECTION_DELIMITER);
      decodeTable(scope.monster.tables.increase, sections[i++]);
      decodeTable(scope.monster.tables.more, sections[i++]);
      decodeTable(scope.shift.tables.shifts, sections[i++]);
      decodeTable(scope.shift.tables.mana, sections[i++]);
      decodeTable(scope.mitigation.tables.reduction, sections[i++]);
      decodeTable(scope.taken.tables.flat, sections[i++]);
      decodeTable(scope.taken.tables.increased, sections[i++]);
      decodeTable(scope.taken.tables.more, sections[i++]);
      scope.hits = sections[i++].split(ROW_DELIMITER).map(function (hit) {
        return {hit: parseIntOrNull(hit)};
      });
      scope.mitigation.armor = parseIntOrNull(sections[i++]);
      scope.mitigation.charges = parseIntOrNull(sections[i++]);
      scope.mitigation.resistance.fire = parseIntOrNull(sections[i++]);
      scope.mitigation.resistance.cold = parseIntOrNull(sections[i++]);
      scope.mitigation.resistance.lightning = parseIntOrNull(sections[i++]);
      scope.mitigation.resistance.chaos = parseIntOrNull(sections[i++]);
      scope.mitigation.health = parseIntOrNull(sections[i++]);
      scope.mitigation.es = parseIntOrNull(sections[i++]);
      scope.mitigation.mana = parseIntOrNull(sections[i++]);
      var booleans = decodeBooleans(sections[i], 2);
      scope.mitigation.chaosBlocked = booleans[0];
      scope.mitigation.chaosImmune = booleans[1];
    }
  };

  function encodeTable(table) {
    var tableData = '';
    for (var i = 0; i < table.length - 1; i++) {
      tableData += encodeBoolean(table[i].enabled);
      if (table[i].name) {
        tableData += table[i].name;
      }
      tableData += VALUE_DELIMITER;
      if (table[i].value) {
        tableData += table[i].value;
      }
      if (table[i].elements) {
        tableData += VALUE_DELIMITER;
        tableData += encodeBooleans(Object.values(table[i].elements));
      }
      if (i !== table.length - 2) {
        tableData += ROW_DELIMITER;
      }
    }
    return tableData + SECTION_DELIMITER;
  }

  function encodeBooleans(booleans) {
    var encoded = booleans.reduce(function (sum, value) {
      return encodeBoolean(value) + sum;
    }, '');
    return parseInt(encoded, 2).toString(36);
  }

  function encodeBoolean(boolean) {
    return +boolean;
  }

  function decodeTable(table, tableString) {
    if (tableString) {
      var rows = tableString.split(ROW_DELIMITER);
      for (var i = 0; i < rows.length; i++) {
        var values = rows[i].split(VALUE_DELIMITER);
        table.addRow(
            decodeBoolean(values[0].slice(0, 1)),
            values[0].slice(1),
            parseIntOrNull(values[1]),
            decodeElements(values[2])
        );
      }
    }
  }

  function decodeElements(encodedElements) {
    if (encodedElements) {
      var booleans = decodeBooleans(encodedElements, ELEMENTS.length);
      var elements = {};
      ELEMENTS.forEach(function (element, index) {
        elements[element] = booleans[index];
      });
      return elements;
    }
  }

  function decodeBooleans(encoded, length) {
    var booleans = [];
    var booleanString = parseInt(encoded, 36).toString(2);
    var stringLength = booleanString.length;
    for (var i = 0; i < length; i++) {
      booleans[i] = decodeBoolean(booleanString[--stringLength]);
    }
    return booleans;
  }

  function decodeBoolean(string) {
    return string === '1';
  }

  function parseIntOrNull(string) {
    var int = parseInt(string);
    return isNaN(int) ? null : int;
  }
});