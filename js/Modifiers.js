angular.module('PathOfDamage')
.service('Modifiers', function () {
  return {
    getModifiers: function () {
      return sort(
          this.getMobModifiers()
          .concat(this.getDamageShifts())
          .concat(this.getAdditionalReduction())
          .concat(this.getFlatIncreases())
          .concat(this.getIncreasedTaken())
          .concat(this.getMoreTaken())
          .concat(this.getTakenFromMana())
      );
    },
    getMobModifiers: function () {
      return sort([
        new MonsterIncreased(1, 'Increased Monster Damage (Low Tier)', 19),
        new MonsterIncreased(2, 'Increased Monster Damage (Mid Tier)', 24),
        new MonsterIncreased(3, 'Increased Monster Damage (High Tier)', 30),
        new MonsterMore(4, 'Enfeeble', -30),
        new MonsterMore(5, 'Arohongui, Moon\'s Presence', -8),
        new MonsterMore(6, 'Worthy Foe', -10),
        new MonsterMore(7, 'Taunted', -10)
      ]);
    },
    getDamageShifts: function () {
      return sort([
        new Shift(8, 'Cloak of Flame', 20, 1),
        new Shift(9, 'Darkscorn', 25, 4),
        new Shift(10, 'Lightning Coil', 30, 3),
        new Shift(11, 'Lightning Coil (Legacy)', 40, 3),
        new Shift(12, 'Taste of Hate', 20, 2),
        new Shift(13, 'Taste of Hate (Legacy)', 30, 2),
        new Shift(14, 'The Formless Inferno', 8, 1),
        new Shift(15, 'Redblade Helmet Prefix', 10, 1),
        new Shift(16, 'Essence of Horror', 15, 2)
      ]);
    },
    getAdditionalReduction: function () {
      return sort([
        new Reduction(17, 'Basalt Flask', 20),
        new Reduction(18, 'Chaos Golem', 4),
        new Reduction(19, 'Soul of Steel', 4),
        new Reduction(20, 'Flesh Binder', 12),
        new Reduction(21, 'Unwavering Faith', 10),
        new Reduction(22, 'Longtooth Talisman', 6),
        new Reduction(23, 'Necromancer (Ascendant)', 4),
        new Reduction(24, 'Oak Bandit Reward', 2)
      ]);
    },
    getFlatIncreases: function () {
      return [
        new FlatTaken(25, 'Ashrend', -6, [0]),
        new FlatTaken(26, 'Astramentis', -4, [0]),
        new FlatTaken(27, 'Bramblejack', -2, [0]),
        new FlatTaken(28, 'Immortal Flesh', -45, [0]),
        new FlatTaken(29, 'Jaws of Agony', -16, [0]),
        new FlatTaken(30, 'Perandus Blazon', -2, [0]),
        new FlatTaken(31, 'Solaris Lorica', -35, [4]),
        new FlatTaken(32, 'The Formless Flame', -20, [1]),
        new FlatTaken(33, 'Wall of Brambles', -2, [0])
      ];
    },
    getIncreasedTaken: function () {
      return sort([
        new IncreasedTaken(34, 'Abyssus', 40, [0]),
        new IncreasedTaken(35, 'Brittle Barrier', 10, [0, 1, 2, 3, 4]),
        new IncreasedTaken(36, 'Fragile Bloom', 10, [0, 1, 2, 3, 4]),
        new IncreasedTaken(37, 'Hyaon\'s Fury', 8, [0, 1, 2, 3, 4]),
        new IncreasedTaken(38, 'Nomic\'s Storm', 15, [0, 1, 2, 3, 4]),
        new IncreasedTaken(39, 'Oro\'s Sacrifice', 10, [0, 1]),
        new IncreasedTaken(40, 'Sibyl\'s Lament (Right)', -40, [0]),
        new IncreasedTaken(41, 'Sibyl\'s Lament (Left)', -40, [1, 2, 3]),
        new IncreasedTaken(42, 'The Beast Fur Shawl', 5, [0, 1, 2, 3, 4]),
        new IncreasedTaken(43, 'The Rat Cage', 20, [1]),
        new IncreasedTaken(44, 'Vulnerability (Mid)', 24, [0]),
        new IncreasedTaken(45, 'Vulnerability (High)', 27, [0]),
        new IncreasedTaken(46, 'Shock', 50, [0, 1, 2, 3, 4]),
        new IncreasedTaken(47, 'Fortify', -20, [0, 1, 2, 3, 4]),
        new IncreasedTaken(48, 'Ash, Frost and Storm', -10, [1, 2, 3]),
        new IncreasedTaken(49, 'Primeval Force', -10, [1, 2, 3]),
        new IncreasedTaken(50, 'Master of Force', -10, [0]),
        new IncreasedTaken(51, 'Paragon of Calamity', -50, [1, 2, 3]),
        new IncreasedTaken(52, 'Rite of Ruin', -6, [0, 1, 2, 3, 4]),
        new IncreasedTaken(53, 'Aspect of Carnage', 10, [0, 1, 2, 3, 4]),
        new IncreasedTaken(54, 'Unrelenting', -8, [1, 2, 3]),
        new IncreasedTaken(55, 'Outmatch and Outlast', -10, [0]),
        new IncreasedTaken(56, 'Blood in the Eyes', -6, [0, 1, 2, 3, 4]),
        new IncreasedTaken(57, 'Conqueror', -6, [0, 1, 2, 3, 4]),
        new IncreasedTaken(58, 'Headsman', -50, [0]),
        new IncreasedTaken(59, 'Nature\'s Boon', -8, [1, 2, 3]),
        new IncreasedTaken(60, 'Born in the Shadows', -6, [0, 1, 2, 3, 4]),
        new IncreasedTaken(61, 'Weave the Arcane', -8, [0, 1, 2, 3, 4]),
        new IncreasedTaken(62, 'Elementalist (Ascendant)', -50, [1, 2, 3]),
        new IncreasedTaken(63, 'Inquisitor (Ascendant)', -8, [0, 1, 2, 3, 4]),
        new IncreasedTaken(64, 'Berserker (Ascendant)', 5, [0, 1, 2, 3, 4]),
        new IncreasedTaken(65, 'Slayer (Ascendant)', -50, [0]),
        new IncreasedTaken(66, 'Champion (Ascendant)', -5, [0, 1, 2, 3, 4])
      ]);
    },
    getMoreTaken: function () {
      return sort([
        new MoreTaken(67, 'Kintsugi', -20, [0, 1, 2, 3, 4]),
        new MoreTaken(68, 'Arctic Armour (Phys)', -13, [0]),
        new MoreTaken(69, 'Arctic Armour (Fire)', -12, [1])
      ]);
    },
    getTakenFromMana: function () {
      return sort([
        new ManaTaken(70, 'Mind Over Matter', 30, [0, 1, 2, 3, 4]),
        new ManaTaken(71, 'Divine Guidance', 10, [0, 1, 2, 3, 4]),
        new ManaTaken(72, 'Cloak of Defiance', 10, [0, 1, 2, 3, 4]),
        new ManaTaken(73, 'The Aylardex', 6, [0, 1, 2, 3, 4]),
        new ManaTaken(74, 'Mind of the Council', 30, [3]),
        new ManaTaken(75, 'Damage taken from Mana Corruption', 6, [0, 1, 2, 3, 4])
      ]);
    }
  };

  function Modifier(id, name, value, section, table, elements) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.section = section;
    this.table = table;
    this.elements = elements;
  }

  function MonsterIncreased(id, name, value) {
    Modifier.call(this, id, name, value, 'monster', 'increased');
  }

  function MonsterMore(id, name, value) {
    Modifier.call(this, id, name, value, 'monster', 'more');
  }

  function Shift(id, name, value, element) {
    Modifier.call(this, id, name, value, 'shift', 'shifts', [element]);
  }

  function Reduction(id, name, value) {
    Modifier.call(this, id, name, value, 'mitigation', 'reduction');
  }

  function FlatTaken(id, name, value, elements) {
    Modifier.call(this, id, name, value, 'taken', 'flat', elements);
  }

  function IncreasedTaken(id, name, value, elements) {
    Modifier.call(this, id, name, value, 'taken', 'increased', elements);
  }

  function MoreTaken(id, name, value, elements) {
    Modifier.call(this, id, name, value, 'taken', 'more', elements);
  }

  function ManaTaken(id, name, value, elements) {
    Modifier.call(this, id, name, value, 'shift', 'mana', elements);
  }

  function sort(modifiers) {
    return modifiers.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }
});