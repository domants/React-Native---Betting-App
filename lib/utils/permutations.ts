export function generatePermutations(str: string): string[] {
  // First check if it's a triple number
  if (str[0] === str[1] && str[1] === str[2]) {
    return []; // Return empty array for triple numbers
  }

  // Count occurrences of each digit
  const digitCount: { [key: string]: number } = {};
  for (const digit of str) {
    digitCount[digit] = (digitCount[digit] || 0) + 1;
  }

  // If it has double numbers, generate only unique permutations
  if (Object.values(digitCount).includes(2)) {
    const permutations = new Set<string>();

    // For double numbers, we'll have 3 unique permutations
    for (let i = 0; i < str.length; i++) {
      for (let j = 0; j < str.length; j++) {
        for (let k = 0; k < str.length; k++) {
          if (i !== j && i !== k && j !== k) {
            permutations.add(str[i] + str[j] + str[k]);
          }
        }
      }
    }

    return Array.from(permutations);
  }

  // For numbers with no repeats, generate all 6 permutations
  if (str.length <= 1) return [str];

  const permutations: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remainingChars = str.slice(0, i) + str.slice(i + 1);
    const innerPermutations = generatePermutations(remainingChars);

    for (const perm of innerPermutations) {
      permutations.push(char + perm);
    }
  }

  return permutations;
}
