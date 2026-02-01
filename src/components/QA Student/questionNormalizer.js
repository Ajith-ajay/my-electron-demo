const superscriptMap = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "n": "ⁿ", "i": "ⁱ", "+": "⁺", "-": "⁻", "=": "⁼",
};

const fractionMap = {
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
};

const convertNestedSqrt = (text) => {
  let result = text;
  const sqrtRegex = /sqrt\s*\(\s*([^)]+?)\s*\)/gi;

  // Repeat until no more sqrt() patterns
  while (sqrtRegex.test(result)) {
    result = result.replace(sqrtRegex, "√($1)");
  }

  return result;
};

const toSuperscript = (value) =>
  value.split("").map(ch => superscriptMap[ch] || ch).join("");

export const formatMathText = (text = "") => {
  let formatted = text;

  formatted = formatted.replace(/\bpi\b/gi, "π");
  
  formatted = convertNestedSqrt(formatted);

  formatted = formatted.replace(/\^([a-zA-Z0-9+\-=]+)/g, (_, power) =>
    toSuperscript(power)
  );

  formatted = formatted.replace(
    /(\d+)\s+(1\/2|1\/3|2\/3|1\/4|3\/4)/g,
    (_, whole, frac) => `${whole}${fractionMap[frac]}`
  );

  formatted = formatted.replace(/\((\d+)\s*\/\s*(\d+)\)/g, "($1⁄$2)");

  // 6️⃣ Units
  formatted = formatted
    .replace(/CM\^2/gi, "cm²")
    .replace(/CM\^3/gi, "cm³")
    .replace(/\bCM\b/gi, "cm");

  // 7️⃣ Preserve line breaks
//   return formatted.split("\n").map((line, i) => (
//     <div key={i}>{line}</div>
//   ));
  return formatted;
};

// --------------------- Testing ----------------------------------------------

const text = "Simplify 3 1/2 x^2 + sqrt(sqrt(sqrt(16)))"

console.log(formatMathText(text))

// =============================================================================
//                             Normalization function
// =============================================================================

function normalizeMathText(input) {
  let text = input;

  // 1️⃣ Constants and units
  text = text.replace(/\bpi\b/gi, "π");
  text = text.replace(/\bCM\^2\b/gi, "cm²");
  text = text.replace(/\bCM\^3\b/gi, "cm³");

  // 2️⃣ Mixed fractions: "3 1/2" → "3½"
  text = text.replace(/(\d+)\s+(\d+)\/(\d+)/g, (_, whole, num, denom) => {
    const fractionMap = { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾", "1/5": "⅕", "2/5": "⅖", "3/5": "⅗", "4/5": "⅘", "1/6": "⅙", "5/6": "⅚", "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞" };
    const frac = `${num}/${denom}`;
    return fractionMap[frac] ? `${whole}${fractionMap[frac]}` : `${whole} ${frac}`;
  });

  // 3️⃣ Simple fractions: "1/2" → "½"
  text = text.replace(/\b(\d+)\/(\d+)\b/g, (_, num, denom) => {
    const fractionMap = { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾", "1/5": "⅕", "2/5": "⅖", "3/5": "⅗", "4/5": "⅘", "1/6": "⅙", "5/6": "⅚", "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞" };
    const frac = `${num}/${denom}`;
    return fractionMap[frac] || frac;
  });

  // 4️⃣ Powers: x^2 → x²
  const superscriptMap = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾"
  };
  text = text.replace(/([a-zA-Zπ0-9]+)\^(\([^\)]+\)|-?\d+)/g, (_, base, power) => {
    if (power.startsWith("(") && power.endsWith(")")) {
      // Handle fractional powers: x^(1/2) → x^(½)
      const inner = power.slice(1, -1);
      return `${base}^(${normalizeMathText(inner)})`;
    } else {
      // Convert single-digit powers to superscript
      return `${base}${power.split("").map(c => superscriptMap[c] || c).join("")}`;
    }
  });

  // 5️⃣ Roots
  // Cube root: cbrt(…) → ∛(…)
  text = text.replace(/cbrt\((.*?)\)/g, (_, inner) => `∛(${normalizeMathText(inner)})`);

  // 4th root: root4(…) → ∜(…)
  text = text.replace(/root4\((.*?)\)/g, (_, inner) => `∜(${normalizeMathText(inner)})`);

  // nth root: root5(...), root6(...) → √[n](…)
  text = text.replace(/root(\d+)\((.*?)\)/g, (_, n, inner) => {
    if (n === "2") return `√(${normalizeMathText(inner)})`; // square root
    if (n === "3") return `∛(${normalizeMathText(inner)})`; // cube root
    if (n === "4") return `∜(${normalizeMathText(inner)})`; // 4th root
    return `√[${n}](${normalizeMathText(inner)})`; // 5th, 6th, etc.
  });

  // Square root shorthand: sqrt(...) → √(...)
  text = text.replace(/sqrt\((.*?)\)/g, (_, inner) => `√(${normalizeMathText(inner)})`);

  // 6️⃣ Trig and log functions remain as is: sin(x), cos(x), ln(x), log(x)
  text = text.replace(/\b(sin|cos|tan|csc|sec|cot|ln|log)\s*\((.*?)\)/gi, (_, func, inner) => {
    // Recursively normalize inner content
    return `${func.toLowerCase()}(${normalizeMathText(inner)})`;
  });

  // log functions
  text = text.replace(/\b(ln|log)(?:([0-9]+))?\s*\((.*?)\)/gi, (_, func, base, inner) => {
    let normalizedInner = normalizeMathText(inner); // Recursively normalize inner content
    if (func.toLowerCase() === "ln") return `ln(${normalizedInner})`; // natural log
    if (base) return `log${base}(${normalizedInner})`; // log with base
    return `log(${normalizedInner})`; // default log
  });

  // 7️⃣ Clean extra spaces
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// ✅ Example usage
console.log(normalizeMathText("3 1/2 x^2 + sqrt(sqrt(sqrt(16))) + cbrt(27) + root4(16) + root5(32) + pi"));