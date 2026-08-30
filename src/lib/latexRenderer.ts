/**
 * LaTeX / MathML / Scientific Typography Rendering Engine
 * 
 * Provides robust transformation of LaTeX mathematical notation, scientific units,
 * Greek symbols, fractions, exponents, subscripts, and formulas into clean,
 * publication-grade typography for PDF generation and document rendering.
 */

import katex from 'katex';

// Superscript character map
const SUPER_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
  'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
  'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
  'A': 'ᴬ', 'B': 'ᴮ', 'D': 'ᴰ', 'E': 'ᴱ', 'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ',
  'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'R': 'ᴿ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ',
};

// Subscript character map
const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ',
};

// Greek alphabet map
const GREEK_MAP: [string, string][] = [
  ['\\alpha', 'α'], ['\\Alpha', 'Α'],
  ['\\beta', 'β'], ['\\Beta', 'Β'],
  ['\\gamma', 'γ'], ['\\Gamma', 'Γ'],
  ['\\delta', 'δ'], ['\\Delta', 'Δ'],
  ['\\epsilon', 'ε'], ['\\varepsilon', 'ε'], ['\\Epsilon', 'Ε'],
  ['\\zeta', 'ζ'], ['\\Zeta', 'Ζ'],
  ['\\eta', 'η'], ['\\Eta', 'Η'],
  ['\\theta', 'θ'], ['\\Theta', 'Θ'], ['\\vartheta', 'ϑ'],
  ['\\iota', 'ι'], ['\\Iota', 'Ι'],
  ['\\kappa', 'κ'], ['\\Kappa', 'Κ'],
  ['\\lambda', 'λ'], ['\\Lambda', 'Λ'],
  ['\\mu', 'μ'], ['\\Mu', 'Μ'],
  ['\\nu', 'ν'], ['\\Nu', 'Ν'],
  ['\\xi', 'ξ'], ['\\Xi', 'Ξ'],
  ['\\omicron', 'ο'], ['\\Omicron', 'Ο'],
  ['\\pi', 'π'], ['\\Pi', 'Π'], ['\\varpi', 'ϖ'],
  ['\\rho', 'ρ'], ['\\Rho', 'Ρ'], ['\\varrho', 'ϱ'],
  ['\\sigma', 'σ'], ['\\Sigma', 'Σ'], ['\\varsigma', 'ς'],
  ['\\tau', 'τ'], ['\\Tau', 'Τ'],
  ['\\upsilon', 'υ'], ['\\Upsilon', 'Υ'],
  ['\\phi', 'φ'], ['\\Phi', 'Φ'], ['\\varphi', 'φ'],
  ['\\chi', 'χ'], ['\\Chi', 'Χ'],
  ['\\psi', 'ψ'], ['\\Psi', 'Ψ'],
  ['\\omega', 'ω'], ['\\Omega', 'Ω'],
];

// Mathematical symbols map (ordered by specific pattern length)
const SYMBOL_MAP: [string, string][] = [
  ['\\cdot', '·'],
  ['\\times', '×'],
  ['\\div', '÷'],
  ['\\pm', '±'],
  ['\\mp', '∓'],
  ['\\approx', '≈'],
  ['\\neq', '≠'],
  ['\\ne', '≠'],
  ['\\leq', '≤'],
  ['\\le', '≤'],
  ['\\geq', '≥'],
  ['\\ge', '≥'],
  ['\\ll', '≪'],
  ['\\gg', '≫'],
  ['\\equiv', '≡'],
  ['\\propto', '∝'],
  ['\\infty', '∞'],
  ['\\partial', '∂'],
  ['\\nabla', '∇'],
  ['\\sum', '∑'],
  ['\\prod', '∏'],
  ['\\int', '∫'],
  ['\\iint', '∬'],
  ['\\iiint', '∭'],
  ['\\oint', '∮'],
  ['\\rightarrow', '→'],
  ['\\to', '→'],
  ['\\leftarrow', '←'],
  ['\\Rightarrow', '⇒'],
  ['\\Leftarrow', '⇐'],
  ['\\Leftrightarrow', '⇔'],
  ['\\leftrightarrow', '↔'],
  ['\\parallel', '∥'],
  ['\\perp', '⊥'],
  ['\\angle', '∠'],
  ['\\in', '∈'],
  ['\\notin', '∉'],
  ['\\subset', '⊂'],
  ['\\subseteq', '⊆'],
  ['\\supset', '⊃'],
  ['\\supseteq', '⊇'],
  ['\\cup', '∪'],
  ['\\cap', '∩'],
  ['\\emptyset', '∅'],
  ['\\varnothing', '∅'],
  ['\\forall', '∀'],
  ['\\exists', '∃'],
  ['\\nexists', '∄'],
  ['\\therefore', '∴'],
  ['\\because', '∵'],
  ['\\dots', '...'],
  ['\\ldots', '...'],
  ['\\cdots', '...'],
  ['\\bullet', '•'],
  ['\\hbar', 'ℏ'],
  ['\\ell', 'ℓ'],
  ['\\prime', '′'],
];

/**
 * Converts ASCII exponent characters to Unicode superscripts
 */
export function toSuperscript(str: string): string {
  if (!str) return '';
  return str
    .split('')
    .map((c) => SUPER_MAP[c] || c)
    .join('');
}

/**
 * Converts ASCII subscript characters to Unicode subscripts
 */
export function toSubscript(str: string): string {
  if (!str) return '';
  return str
    .split('')
    .map((c) => SUB_MAP[c] || c)
    .join('');
}

/**
 * Transforms LaTeX source markup into cleanly rendered math/typography
 * Suitable for direct PDF embedding and print export.
 */
export function renderLaTeXToText(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  let str = input;

  // 1. Unwrap math delimiters: $...$, $$...$$, \(...\), \[...\]
  str = str.replace(/\$\$([^\$]+)\$\$/g, ' $1 ');
  str = str.replace(/\$([^\$]+)\$/g, ' $1 ');
  str = str.replace(/\\\((.*?)\\\)/g, ' $1 ');
  str = str.replace(/\\\[(.*?)\\\]/g, ' $1 ');

  // 2. Degrees and temperature shorthand
  str = str.replace(/\^\{\\circ\}\s*(?:\\text\{C\}|C)?/gi, '°C');
  str = str.replace(/\^\\circ\s*(?:\\text\{C\}|C)?/gi, '°C');
  str = str.replace(/\\degree\s*(?:\\text\{C\}|C)?/gi, '°C');
  str = str.replace(/\^\{\\circ\}/gi, '°');
  str = str.replace(/\^\\circ/gi, '°');
  str = str.replace(/\\circ\b/gi, '°');

  // 3. Mathematical operators and symbol commands (preserve token boundaries)
  for (const [cmd, sym] of SYMBOL_MAP) {
    const reg = new RegExp(cmd.replace(/\\/g, '\\\\') + '(?![a-zA-Z])', 'g');
    str = str.replace(reg, sym);
  }

  // 4. Greek letters (upper and lower case)
  for (const [cmd, sym] of GREEK_MAP) {
    const reg = new RegExp(cmd.replace(/\\/g, '\\\\') + '(?![a-zA-Z])', 'g');
    str = str.replace(reg, sym);
  }

  // 5. Multi-pass fraction resolver (\frac, \dfrac, \tfrac)
  for (let loop = 0; loop < 5; loop++) {
    if (!str.includes('\\frac') && !str.includes('\\dfrac') && !str.includes('\\tfrac')) break;
    str = str.replace(
      /\\(?:frac|dfrac|tfrac)\s*\{((?:[^{}]|\\text\{[^{}]*\})*)\}\s*\{((?:[^{}]|\\text\{[^{}]*\})*)\}/g,
      (_match, num, den) => {
        const cleanNum = renderLaTeXToText(num).trim();
        const cleanDen = renderLaTeXToText(den).trim();
        if (cleanNum === '1' && cleanDen === '2') return '½';
        if (cleanNum === '1' && cleanDen === '4') return '¼';
        if (cleanNum === '3' && cleanDen === '4') return '¾';
        if (cleanNum === '1' && cleanDen === '3') return '⅓';
        if (cleanNum === '2' && cleanDen === '3') return '⅔';
        if (cleanNum === '1' && cleanDen === '8') return '⅛';
        if (cleanNum === '3' && cleanDen === '8') return '⅜';
        if (cleanNum === '5' && cleanDen === '8') return '⅝';
        if (cleanNum === '7' && cleanDen === '8') return '⅞';

        const needParenNum =
          cleanNum.includes(' ') || cleanNum.includes('+') || cleanNum.includes('-') || cleanNum.includes('=');
        const needParenDen =
          cleanDen.includes(' ') || cleanDen.includes('+') || cleanDen.includes('-') || cleanDen.includes('=');
        const nStr = needParenNum ? `(${cleanNum})` : cleanNum;
        const dStr = needParenDen ? `(${cleanDen})` : cleanDen;
        return `${nStr} / ${dStr}`;
      }
    );
  }

  // 6. Roots: \sqrt[n]{x} and \sqrt{x}
  str = str.replace(/\\sqrt\[(.*?)\]\{(.*?)\}/g, (_m, n, x) => `${toSuperscript(n)}√(${renderLaTeXToText(x)})`);
  str = str.replace(/\\sqrt\{(.*?)\}/g, (_m, x) => `√(${renderLaTeXToText(x)})`);

  // 7. Strip font and text styling wrappers (\text{...}, \mathrm{...}, etc.)
  for (let l = 0; l < 4; l++) {
    str = str.replace(
      /\\(?:text|mathrm|textrm|textsf|textbf|textit|mathbf|mathit|boldsymbol|operatorname)\{([^{}]*)\}/g,
      '$1'
    );
  }

  // 8. Vector and accent notations
  str = str.replace(/\\vec\{([^{}])\}/g, '$1⃗');
  str = str.replace(/\\hat\{([^{}])\}/g, '$1̂');
  str = str.replace(/\\bar\{([^{}])\}/g, '$1̄');
  str = str.replace(/\\tilde\{([^{}])\}/g, '$1̃');

  // 9. Exponents and superscripts: ^{...} and ^x
  str = str.replace(/\^\{([^{}]+)\}/g, (_m, content) => toSuperscript(content));
  str = str.replace(/\^([0-9a-zA-Z+\-()])/g, (_m, char) => toSuperscript(char));

  // 10. Subscripts: _{...} and _x
  str = str.replace(/\_\{([^{}]+)\}/g, (_m, content) => toSubscript(content));
  str = str.replace(/\_([0-9a-zA-Z+\-()])/g, (_m, char) => toSubscript(char));

  // 11. Sizing delimiters and formatting wrappers
  str = str.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  str = str.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  str = str.replace(/\\left\\\{/g, '{').replace(/\\right\\\}/g, '}');
  str = str.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');
  str = str.replace(/\\left\./g, '').replace(/\\right\./g, '');
  str = str.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
  str = str.replace(/\\quad/g, '  ').replace(/\\qquad/g, '    ');
  str = str.replace(/\\[,;:!]/g, ' ');
  str = str.replace(/\\%/g, '%').replace(/\\\$/g, '$').replace(/\\_/g, '_').replace(/\\&/g, '&').replace(/\\#/g, '#');

  // 12. Standard function names
  const mathFuncs = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'exp', 'lim', 'max', 'min', 'det', 'gcd'];
  for (const func of mathFuncs) {
    const reg = new RegExp(`\\\\${func}\\b`, 'g');
    str = str.replace(reg, func);
  }

  // 13. Remove any remaining stray backslash commands
  str = str.replace(/\\[a-zA-Z]+/g, '');

  // 14. Normalize whitespace
  str = str.replace(/\s+/g, ' ');

  return str.trim();
}

/**
 * Renders LaTeX to MathML using KaTeX
 */
export function renderLaTeXToMathML(latex: string): string {
  try {
    return katex.renderToString(latex, {
      output: 'mathml',
      throwOnError: false,
    });
  } catch (err) {
    console.warn('[LaTeXRenderer] MathML conversion fallback:', err);
    return renderLaTeXToText(latex);
  }
}

/**
 * Renders LaTeX to HTML using KaTeX
 */
export function renderLaTeXToHTML(latex: string): string {
  try {
    return katex.renderToString(latex, {
      output: 'html',
      throwOnError: false,
    });
  } catch (err) {
    console.warn('[LaTeXRenderer] HTML conversion fallback:', err);
    return renderLaTeXToText(latex);
  }
}

/**
 * Recursively cleans and formats any question object or array
 */
export function sanitizeQuestionContent<T>(data: T): T {
  if (!data) return data;

  if (typeof data === 'string') {
    return renderLaTeXToText(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeQuestionContent(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      sanitizedObj[key] = sanitizeQuestionContent(value);
    }
    return sanitizedObj as T;
  }

  return data;
}

export default {
  renderLaTeXToText,
  renderLaTeXToMathML,
  renderLaTeXToHTML,
  toSuperscript,
  toSubscript,
  sanitizeQuestionContent,
};
