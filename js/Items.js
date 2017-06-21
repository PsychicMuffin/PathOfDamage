angular.module('PathOfDamage')
.service('Items', function () {
  return {
    getItems: function () {
      return [
        // Monster Modifications
        {id: 1, name: 'Increased Monster Damage (Low Tier)', value: 19, section: 'monster', table: 'increased'},
        {id: 2, name: 'Increased Monster Damage (Mid Tier)', value: 24, section: 'monster', table: 'increased'},
        {id: 3, name: 'Increased Monster Damage (High Tier)', value: 30, section: 'monster', table: 'increased'},
        {id: 4, name: 'Enfeeble', value: -30, section: 'monster', table: 'more'},
        {id: 5, name: 'Arohongui, Moon\'s Presence', value: -8, section: 'monster', table: 'more'},
        {id: 6, name: 'Worthy Foe', value: -10, section: 'monster', table: 'more'},
        {id: 7, name: 'Taunted', value: -10, section: 'monster', table: 'more'},

        // Damage Shift
        {id: 8, name: 'Cloak of Flame', value: 20, section: 'shift', table: 'shifts', elements: [1]},
        {id: 9, name: 'Darkscorn', value: 25, section: 'shift', table: 'shifts', elements: [4]},
        {id: 10, name: 'Lightning Coil', value: 30, section: 'shift', table: 'shifts', elements: [3]},
        {id: 11, name: 'Lightning Coil (Legacy)', value: 40, section: 'shift', table: 'shifts', elements: [4]},
        {id: 12, name: 'Taste of Hate', value: 20, section: 'shift', table: 'shifts', elements: [2]},
        {id: 13, name: 'Taste of Hate (Legacy)', value: 30, section: 'shift', table: 'shifts', elements: [2]},
        {id: 14, name: 'The Formless Inferno', value: 8, section: 'shift', table: 'shifts', elements: [1]},
        {id: 15, name: 'Redblade Helmet Prefix', value: 10, section: 'shift', table: 'shifts', elements: [1]},
        {id: 16, name: 'Essence of Horror', value: 15, section: 'shift', table: 'shifts', elements: [2]},

        // Additional Physical Damage Reduction
        {id: 17, name: 'Basalt Flask', value: 20, section: 'mitigation', table: 'reduction'},
        {id: 18, name: 'Chaos Golem', value: 4, section: 'mitigation', table: 'reduction'},
        {id: 19, name: 'Soul of Steel', value: 4, section: 'mitigation', table: 'reduction'},
        {id: 20, name: 'Flesh Binder', value: 12, section: 'mitigation', table: 'reduction'},
        {id: 21, name: 'Unwavering Faith', value: 10, section: 'mitigation', table: 'reduction'},
        {id: 22, name: 'Longtooth Talisman', value: 6, section: 'mitigation', table: 'reduction'},
        {id: 23, name: 'Necromancer (Ascendant)', value: 4, section: 'mitigation', table: 'reduction'},
        {id: 24, name: 'Oak Bandit Reward', value: 2, section: 'mitigation', table: 'reduction'},

        // Flat Increases
        {id: 25, name: 'Ashrend', value: -6, section: 'taken', table: 'flat', elements: [0]},
        {id: 26, name: 'Astramentis', value: -4, section: 'taken', table: 'flat', elements: [0]},
        {id: 27, name: 'Bramblejack', value: -2, section: 'taken', table: 'flat', elements: [0]},
        {id: 28, name: 'Immortal Flesh', value: -45, section: 'taken', table: 'flat', elements: [0]},
        {id: 29, name: 'Jaws of Agony', value: -16, section: 'taken', table: 'flat', elements: [0]},
        {id: 30, name: 'Perandus Blazon', value: -2, section: 'taken', table: 'flat', elements: [0]},
        {id: 31, name: 'Solaris Lorica', value: -35, section: 'taken', table: 'flat', elements: [4]},
        {id: 32, name: 'The Formless Flame', value: -20, section: 'taken', table: 'flat', elements: [1]},
        {id: 33, name: 'Wall of Brambles', value: -2, section: 'taken', table: 'flat', elements: [0]},

        // Increased Damage Taken
        {id: 34, name: 'Abyssus', value: 40, section: 'taken', table: 'increased', elements: [0]},
        {id: 35, name: 'Brittle Barrier', value: 10, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 36, name: 'Fragile Bloom', value: 10, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 37, name: 'Hyaon\'s Fury', value: 8, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 38, name: 'Nomic\'s Storm', value: 15, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 39, name: 'Oro\'s Sacrifice', value: 10, section: 'taken', table: 'increased', elements: [0,1]},
        {id: 40, name: 'Sibyl\'s Lament (Right)', value: -40, section: 'taken', table: 'increased', elements: [0]},
        {id: 41, name: 'Sibyl\'s Lament (Left)', value: -40, section: 'taken', table: 'increased', elements: [1,2,3]},
        {id: 42, name: 'The Beast Fur Shawl', value: 5, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 43, name: 'The Rat Cage', value: 20, section: 'taken', table: 'increased', elements: [1]},
        {id: 44, name: 'Vulnerability (Mid)', value: 24, section: 'taken', table: 'increased', elements: [0]},
        {id: 45, name: 'Vulnerability (High)', value: 27, section: 'taken', table: 'increased', elements: [0]},
        {id: 46, name: 'Shock', value: 50, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 47, name: 'Fortify', value: -20, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 48, name: 'Ash, Frost and Storm', value: -10, section: 'taken', table: 'increased', elements: [1,2,3]},
        {id: 49, name: 'Primeval Force', value: -10, section: 'taken', table: 'increased', elements: [1,2,3]},
        {id: 50, name: 'Master of Force', value: -10, section: 'taken', table: 'increased', elements: [0]},
        {id: 51, name: 'Paragon of Calamity', value: -50, section: 'taken', table: 'increased', elements: [1,2,3]},
        {id: 52, name: 'Rite of Ruin', value: -6, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 53, name: 'Aspect of Carnage', value: 10, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 54, name: 'Unrelenting', value: -8, section: 'taken', table: 'increased', elements: [1,2,3]},
        {id: 55, name: 'Outmatch and Outlast', value: -10, section: 'taken', table: 'increased', elements: [0]},
        {id: 56, name: 'Blood in the Eyes', value: -6, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 57, name: 'Conqueror', value: -6, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 58, name: 'Headsman', value: -50, section: 'taken', table: 'increased', elements: [0]},
        {id: 59, name: 'Nature\'s Boon', value: -8, section: 'taken', table: 'increased', elements: [1,2,3]},
        {id: 60, name: 'Born in the Shadows', value: -6, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 61, name: 'Weave the Arcane', value: -8, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 62, name: 'Elementalist (Ascendant)', value: -50, section: 'taken', table: 'increased', elements: [1,2,3]},
        {id: 63, name: 'Inquisitor (Ascendant)', value: -8, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 64, name: 'Berserker (Ascendant)', value: 5, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 65, name: 'Slayer (Ascendant)', value: -50, section: 'taken', table: 'increased', elements: [0]},
        {id: 66, name: 'Champion (Ascendant)', value: -5, section: 'taken', table: 'increased', elements: [0,1,2,3,4]},
        {id: 76, name: 'The Wise Oak', value: -10, section: 'taken', table: 'increased', elements: [1,2,3]},

        // More Damage Taken
        {id: 67, name: 'Kintsugi', value: -20, section: 'taken', table: 'more', elements: [0,1,2,3,4]},
        {id: 68, name: 'Arctic Armour (Phys)', value: -13, section: 'taken', table: 'more', elements: [0]},
        {id: 69, name: 'Arctic Armour (Fire)', value: -12, section: 'taken', table: 'more', elements: [1]},

        // Damage Taken From Mana Before Life
        {id: 70, name: 'Mind Over Matter', value: 30, section: 'shift', table: 'mana', elements: [0,1,2,3,4]},
        {id: 71, name: 'Divine Guidance', value: 10, section: 'shift', table: 'mana', elements: [0,1,2,3,4]},
        {id: 72, name: 'Cloak of Defiance', value: 20, section: 'shift', table: 'mana', elements: [0,1,2,3,4]},
        {id: 73, name: 'The Aylardex', value: 6, section: 'shift', table: 'mana', elements: [0,1,2,3,4]},
        {id: 74, name: 'Mind of the Council', value: 30, section: 'shift', table: 'mana', elements: [3]},
        {id: 75, name: 'Damage taken from Mana Corruption', value: 6, section: 'shift', table: 'mana', elements: [0,1,2,3,4]}
      ].sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });
    }
  }
});