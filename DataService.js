angular.module('PathOfDamage')
.service('DataService', function () {
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
              placeholder: "More Damage",
              totalName: "More Monster Damage",
              total: 0
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
              totalName: "Flat Physical Reduction",
              total: 0
            },
            reduced: {
              placeholder: "Reduced Taken",
              totalName: "Reduced Damage Taken",
              total: 0
            },
            less: {
              placeholder: "Less Taken",
              totalName: "Less Damage Taken",
              total: 0
            }
          }
        }
      };
    },
    serializeDataTable: function (table) {
      var data = [];
      for (var i = 0; i < table.length - 1; i++) {
        data.push(+table[i].enabled);
        data.push(table[i].name);
        data.push(table[i].value);
      }
      return data;
    },
    deserializeDataTable: function (list) {
      var table = [];
      for (var i = 0; i < list.length / 3; i++) {
        table.push({
          enabled: !!list[3 * i],
          name: list[3 * i + 1],
          value: list[3 * i + 2]
        });
      }
      return table;
    },
    serializeHits: function (hits) {
      return hits.slice(0, -1).map(function (hit) {
        return hit.hit;
      });
    },
    deserializeHits: function (hits) {
      return hits.map(function (hit) {
        return {hit: hit};
      });
    }
  };
});