/**
 * Mixed Nigerian Tribe Name Generators & Data
 * Combines Igbo, Yoruba, Hausa/Northern, and Niger-Delta names to reflect
 * authentic pan-Nigerian identity (e.g., Ifeanyi Olayemi Audu for male,
 * Chioma Folashade Amina for female).
 */

export const MIXED_TRIBE_MALE_NAMES = [
  'Ifeanyi Olayemi Audu',
  'Chidiebere Babatunde Usman',
  'Chukwuemeka Adebayo Danjuma',
  'Obinna Kayode Shehu',
  'Nnamdi Olusegun Garba',
  'Ikechukwu Folarin Bello',
  'Somtochukwu Damilola Haruna',
  'Tochukwu Adeyemi Yakubu',
  'Kelechi Oladipo Mustapha',
  'Ebuka Ayodele Balarabe',
  'Kenechukwu Mobolaji Sanusi',
  'Chinedu Adewale Idris',
  'Emeka Olatunji Dahiru',
  'Uchechukwu Gbenga Tanko',
  'Onyekachi Olumide Aliyu',
];

export const MIXED_TRIBE_FEMALE_NAMES = [
  'Chioma Folashade Amina',
  'Ngozi Titilayo Fatima',
  'Oluchi Omolara Zainab',
  'Chiamaka Abiola Halima',
  'Ifunanya Morenike Aisha',
  'Adanna Modupe Khadija',
  'Nkechi Bukola Bilkisu',
  'Amaka Eniola Maryam',
  'Chinelo Adeola Hauwa',
  'Nneka Ronke Safiya',
  'Uchechi Yetunde Hadiza',
  'Chidinma Oluwakemi Nafisa',
  'Ijeoma Funmilayo Rukaiya',
  'Ogechi Temitope Asmau',
  'Amarachi Bisola Samira',
];

export const IGBO_MALE_FIRST = [
  'Ifeanyi',
  'Chidiebere',
  'Chukwuemeka',
  'Obinna',
  'Nnamdi',
  'Ikechukwu',
  'Somtochukwu',
  'Tochukwu',
  'Kelechi',
  'Ebuka',
];

export const YORUBA_MALE_MIDDLE = [
  'Olayemi',
  'Babatunde',
  'Adebayo',
  'Kayode',
  'Olusegun',
  'Folarin',
  'Damilola',
  'Adeyemi',
  'Oladipo',
  'Ayodele',
];

export const NORTHERN_LAST = [
  'Audu',
  'Usman',
  'Danjuma',
  'Shehu',
  'Garba',
  'Bello',
  'Haruna',
  'Yakubu',
  'Mustapha',
  'Balarabe',
  'Sanusi',
  'Idris',
];

export const IGBO_FEMALE_FIRST = [
  'Chioma',
  'Ngozi',
  'Oluchi',
  'Chiamaka',
  'Ifunanya',
  'Adanna',
  'Nkechi',
  'Amaka',
  'Chinelo',
  'Nneka',
];

export const YORUBA_FEMALE_MIDDLE = [
  'Folashade',
  'Titilayo',
  'Omolara',
  'Abiola',
  'Morenike',
  'Modupe',
  'Bukola',
  'Eniola',
  'Adeola',
  'Ronke',
];

export const NORTHERN_FEMALE_LAST = [
  'Amina',
  'Fatima',
  'Zainab',
  'Halima',
  'Aisha',
  'Khadija',
  'Bilkisu',
  'Maryam',
  'Hauwa',
  'Safiya',
];

export function generateMixedNigerianName(gender: 'male' | 'female' = 'male'): string {
  if (gender === 'male') {
    const first = IGBO_MALE_FIRST[Math.floor(Math.random() * IGBO_MALE_FIRST.length)];
    const mid = YORUBA_MALE_MIDDLE[Math.floor(Math.random() * YORUBA_MALE_MIDDLE.length)];
    const last = NORTHERN_LAST[Math.floor(Math.random() * NORTHERN_LAST.length)];
    return `${first} ${mid} ${last}`;
  } else {
    const first = IGBO_FEMALE_FIRST[Math.floor(Math.random() * IGBO_FEMALE_FIRST.length)];
    const mid = YORUBA_FEMALE_MIDDLE[Math.floor(Math.random() * YORUBA_FEMALE_MIDDLE.length)];
    const last = NORTHERN_FEMALE_LAST[Math.floor(Math.random() * NORTHERN_FEMALE_LAST.length)];
    return `${first} ${mid} ${last}`;
  }
}

export function getRandomMixedName(preferredGender?: 'male' | 'female'): string {
  const gender = preferredGender || (Math.random() > 0.5 ? 'male' : 'female');
  return generateMixedNigerianName(gender);
}
