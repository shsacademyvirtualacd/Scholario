/**
 * High-performance, robust Urdu & Arabic script reshaper and bidirectional handler.
 * Converts logical Unicode Urdu/Arabic characters into visual Presentation Forms (Forms A & B)
 * and formats Right-To-Left lines so that standard PDF engines (like jsPDF) with embedded
 * TrueType fonts render beautifully shaped, connected, and properly ordered Urdu script.
 */

import type { jsPDF } from 'jspdf';

// Check if a string contains any Urdu/Arabic characters
export function containsUrdu(text: string | null | undefined): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

// Character categories
type JoinType = 'NONE' | 'RIGHT' | 'DUAL';

interface GlyphForms {
  join: JoinType;
  isolated: string;
  final: string;
  initial: string;
  medial: string;
}

// Authoritative lookup table for Arabic, Persian and Urdu Unicode code points to Presentation Forms
const CHAR_MAP: Record<string, GlyphForms> = {
  // Standard Arabic & Common Urdu Characters
  '\u0621': { join: 'NONE', isolated: '\uFE80', final: '\uFE80', initial: '\uFE80', medial: '\uFE80' }, // ء Hamza
  '\u0622': { join: 'RIGHT', isolated: '\uFE81', final: '\uFE82', initial: '\uFE81', medial: '\uFE82' }, // آ Alef with Madda
  '\u0623': { join: 'RIGHT', isolated: '\uFE83', final: '\uFE84', initial: '\uFE83', medial: '\uFE84' }, // أ Alef with Hamza Above
  '\u0624': { join: 'RIGHT', isolated: '\uFE85', final: '\uFE86', initial: '\uFE85', medial: '\uFE86' }, // ؤ Waw with Hamza
  '\u0625': { join: 'RIGHT', isolated: '\uFE87', final: '\uFE88', initial: '\uFE87', medial: '\uFE88' }, // إ Alef with Hamza Below
  '\u0626': { join: 'DUAL', isolated: '\uFE89', final: '\uFE8A', initial: '\uFE8B', medial: '\uFE8C' }, // ئ Yeh with Hamza
  '\u0627': { join: 'RIGHT', isolated: '\uFE8D', final: '\uFE8E', initial: '\uFE8D', medial: '\uFE8E' }, // ا Alef
  '\u0628': { join: 'DUAL', isolated: '\uFE8F', final: '\uFE90', initial: '\uFE91', medial: '\uFE92' }, // ب Baa
  '\u0629': { join: 'RIGHT', isolated: '\uFE93', final: '\uFE94', initial: '\uFE93', medial: '\uFE94' }, // ة Taa Marbuta
  '\u062A': { join: 'DUAL', isolated: '\uFE95', final: '\uFE96', initial: '\uFE97', medial: '\uFE98' }, // ت Taa
  '\u062B': { join: 'DUAL', isolated: '\uFE99', final: '\uFE9A', initial: '\uFE9B', medial: '\uFE9C' }, // ث Thaa
  '\u062C': { join: 'DUAL', isolated: '\uFE9D', final: '\uFE9E', initial: '\uFE9F', medial: '\uFEA0' }, // ج Jeem
  '\u062D': { join: 'DUAL', isolated: '\uFEA1', final: '\uFEA2', initial: '\uFEA3', medial: '\uFEA4' }, // ح Haa
  '\u062E': { join: 'DUAL', isolated: '\uFEA5', final: '\uFEA6', initial: '\uFEA7', medial: '\uFEA8' }, // خ Khaa
  '\u062F': { join: 'RIGHT', isolated: '\uFEA9', final: '\uFEAA', initial: '\uFEA9', medial: '\uFEAA' }, // د Daal
  '\u0630': { join: 'RIGHT', isolated: '\uFEAB', final: '\uFEAC', initial: '\uFEAB', medial: '\uFEAC' }, // ذ Dhaal
  '\u0631': { join: 'RIGHT', isolated: '\uFEAD', final: '\uFEAE', initial: '\uFEAD', medial: '\uFEAE' }, // ر Raa
  '\u0632': { join: 'RIGHT', isolated: '\uFEAF', final: '\uFEB0', initial: '\uFEAF', medial: '\uFEB0' }, // ز Zay
  '\u0633': { join: 'DUAL', isolated: '\uFEB1', final: '\uFEB2', initial: '\uFEB3', medial: '\uFEB4' }, // س Seen
  '\u0634': { join: 'DUAL', isolated: '\uFEB5', final: '\uFEB6', initial: '\uFEB7', medial: '\uFEB8' }, // ش Sheen
  '\u0635': { join: 'DUAL', isolated: '\uFEB9', final: '\uFEBA', initial: '\uFEBB', medial: '\uFEBC' }, // ص Saad
  '\u0636': { join: 'DUAL', isolated: '\uFEBD', final: '\uFEBE', initial: '\uFEBF', medial: '\uFEC0' }, // ض Daad
  '\u0637': { join: 'DUAL', isolated: '\uFEC1', final: '\uFEC2', initial: '\uFEC3', medial: '\uFEC4' }, // ط Taa
  '\u0638': { join: 'DUAL', isolated: '\uFEC5', final: '\uFEC6', initial: '\uFEC7', medial: '\uFEC8' }, // ظ Dhaa
  '\u0639': { join: 'DUAL', isolated: '\uFEC9', final: '\uFECA', initial: '\uFECB', medial: '\uFECC' }, // ع Ayn
  '\u063A': { join: 'DUAL', isolated: '\uFECD', final: '\uFECE', initial: '\uFECF', medial: '\uFED0' }, // غ Ghayn
  '\u0640': { join: 'DUAL', isolated: '\u0640', final: '\u0640', initial: '\u0640', medial: '\u0640' }, // ـ Tatweel
  '\u0641': { join: 'DUAL', isolated: '\uFED1', final: '\uFED2', initial: '\uFED3', medial: '\uFED4' }, // ف Faa
  '\u0642': { join: 'DUAL', isolated: '\uFED5', final: '\uFED6', initial: '\uFED7', medial: '\uFED8' }, // ق Qaaf
  '\u0643': { join: 'DUAL', isolated: '\uFED9', final: '\uFEDA', initial: '\uFEDB', medial: '\uFEDC' }, // ك Arabic Kaaf
  '\u0644': { join: 'DUAL', isolated: '\uFEDD', final: '\uFEDE', initial: '\uFEDF', medial: '\uFEE0' }, // ل Laam
  '\u0645': { join: 'DUAL', isolated: '\uFEE1', final: '\uFEE2', initial: '\uFEE3', medial: '\uFEE4' }, // م Meem
  '\u0646': { join: 'DUAL', isolated: '\uFEE5', final: '\uFEE6', initial: '\uFEE7', medial: '\uFEE8' }, // ن Noon
  '\u0647': { join: 'DUAL', isolated: '\uFEE9', final: '\uFEEA', initial: '\uFEEB', medial: '\uFEEC' }, // ه Arabic Heh
  '\u0648': { join: 'RIGHT', isolated: '\uFEED', final: '\uFEEE', initial: '\uFEED', medial: '\uFEEE' }, // و Waw
  '\u0649': { join: 'DUAL', isolated: '\uFEEF', final: '\uFEF0', initial: '\uFBE8', medial: '\uFBE9' }, // ى Alef Maksura
  '\u064A': { join: 'DUAL', isolated: '\uFEF1', final: '\uFEF2', initial: '\uFEF3', medial: '\uFEF4' }, // ي Arabic Yeh

  // ── Specialized Urdu Characters ──
  '\u0679': { join: 'DUAL', isolated: '\uFB66', final: '\uFB67', initial: '\uFB68', medial: '\uFB69' }, // ٹ Urdu Tte
  '\u067E': { join: 'DUAL', isolated: '\uFB56', final: '\uFB57', initial: '\uFB58', medial: '\uFB59' }, // پ Pe
  '\u0686': { join: 'DUAL', isolated: '\uFB7A', final: '\uFB7B', initial: '\uFB7C', medial: '\uFB7D' }, // چ Tcheh / Che
  '\u0688': { join: 'RIGHT', isolated: '\uFB88', final: '\uFB89', initial: '\uFB88', medial: '\uFB89' }, // ڈ Urdu Ddal
  '\u0691': { join: 'RIGHT', isolated: '\uFB8C', final: '\uFB8D', initial: '\uFB8C', medial: '\uFB8D' }, // ڑ Urdu Rre
  '\u0698': { join: 'RIGHT', isolated: '\uFB8A', final: '\uFB8B', initial: '\uFB8A', medial: '\uFB8B' }, // ژ Zhe
  '\u06A9': { join: 'DUAL', isolated: '\uFB8E', final: '\uFB8F', initial: '\uFB90', medial: '\uFB91' }, // ک Urdu Keheh
  '\u06AF': { join: 'DUAL', isolated: '\uFB92', final: '\uFB93', initial: '\uFB94', medial: '\uFB95' }, // گ Gaf
  '\u06BA': { join: 'RIGHT', isolated: '\uFB9E', final: '\uFB9F', initial: '\uFB9E', medial: '\uFB9F' }, // ں Noon Ghunna
  '\u06BE': { join: 'DUAL', isolated: '\uFBAC', final: '\uFBAD', initial: '\uFBAC', medial: '\uFBAD' }, // ھ Do-chashmi Heh
  '\u06C1': { join: 'DUAL', isolated: '\uFBA6', final: '\uFBA7', initial: '\uFBA8', medial: '\uFBA9' }, // ہ Goal Heh
  '\u06CC': { join: 'DUAL', isolated: '\uFBFC', final: '\uFBFD', initial: '\uFBFE', medial: '\uFBFF' }, // ی Urdu Choti Yeh
  '\u06D2': { join: 'RIGHT', isolated: '\uFBAE', final: '\uFBAF', initial: '\uFBAE', medial: '\uFBAF' }, // ے Urdu Barree Yeh
  '\u06D3': { join: 'RIGHT', isolated: '\uFBB0', final: '\uFBB1', initial: '\uFBB0', medial: '\uFBB1' }, // ئے Yeh Barree with Hamza
};

// Tashkeel / Harakat characters (diacritics)
const TASHKEEL = new Set([
  '\u064B', '\u064C', '\u064D', '\u064E', '\u064F', '\u0650', '\u0651', '\u0652', '\u0653', '\u0670'
]);

/**
 * Reshapes an Arabic/Urdu string so connected letters are converted into their correct positional glyphs.
 */
export function reshapeUrdu(text: string): string {
  if (!text) return '';

  const chars: string[] = Array.from(text);
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    // Handle Tashkeel (pass through without modifying neighbor context)
    if (TASHKEEL.has(ch)) {
      result.push(ch);
      continue;
    }

    // Special Lam-Alif Ligatures (ل + ا / ل + آ / ل + أ / ل + إ)
    if (ch === '\u0644' && i + 1 < chars.length) {
      let nextIdx = i + 1;
      while (nextIdx < chars.length && TASHKEEL.has(chars[nextIdx])) nextIdx++;

      if (nextIdx < chars.length) {
        const nextCh = chars[nextIdx];
        let ligature: { isolated: string; final: string } | null = null;

        if (nextCh === '\u0627') ligature = { isolated: '\uFEFB', final: '\uFEFC' }; // لا
        else if (nextCh === '\u0622') ligature = { isolated: '\uFEF5', final: '\uFEF6' }; // لآ
        else if (nextCh === '\u0623') ligature = { isolated: '\uFEF7', final: '\uFEF8' }; // لأ
        else if (nextCh === '\u0625') ligature = { isolated: '\uFEF9', final: '\uFEFA' }; // لإ

        if (ligature) {
          // Check if previous character connects to Lam
          let prevIdx = i - 1;
          while (prevIdx >= 0 && TASHKEEL.has(chars[prevIdx])) prevIdx--;

          const prevCh = prevIdx >= 0 ? chars[prevIdx] : null;
          const prevEntry = prevCh ? CHAR_MAP[prevCh] : null;
          const connectsRight = prevEntry && (prevEntry.join === 'DUAL');

          result.push(connectsRight ? ligature.final : ligature.isolated);
          i = nextIdx; // Skip the Alif
          continue;
        }
      }
    }

    const entry = CHAR_MAP[ch];
    if (!entry) {
      // Non-Arabic/Urdu character or unsupported glyph (e.g. English, digit, space)
      result.push(ch);
      continue;
    }

    // Determine connection to previous character (Right connection)
    let prevIdx = i - 1;
    while (prevIdx >= 0 && TASHKEEL.has(chars[prevIdx])) prevIdx--;

    const prevCh = prevIdx >= 0 ? chars[prevIdx] : null;
    const prevEntry = prevCh ? CHAR_MAP[prevCh] : null;
    const connectsRight = !!(prevEntry && (prevEntry.join === 'DUAL'));

    // Determine connection to next character (Left connection)
    let nextIdx = i + 1;
    while (nextIdx < chars.length && TASHKEEL.has(chars[nextIdx])) nextIdx++;

    const nextCh = nextIdx < chars.length ? chars[nextIdx] : null;
    const nextEntry = nextCh ? CHAR_MAP[nextCh] : null;
    const connectsLeft = !!(entry.join === 'DUAL' && nextEntry && (nextEntry.join === 'RIGHT' || nextEntry.join === 'DUAL'));

    // Select the correct glyph form
    if (connectsRight && connectsLeft) {
      result.push(entry.medial);
    } else if (connectsRight && !connectsLeft) {
      result.push(entry.final);
    } else if (!connectsRight && connectsLeft) {
      result.push(entry.initial);
    } else {
      result.push(entry.isolated);
    }
  }

  return result.join('');
}

/**
 * Bi-directional single-line formatter for mixed Urdu/English text.
 * When text contains Urdu script, it shapes the Urdu words and orders words/characters for right-to-left visual rendering in jsPDF.
 */
export function formatUrduTextForPdf(text: string): string {
  if (!text) return '';
  if (!containsUrdu(text)) return text;

  // 1. Reshape the text to substitute positional Arabic Presentation Forms
  const shaped = reshapeUrdu(text);

  // 2. Tokenize into runs of Urdu vs English/Numbers/Symbols
  const tokens: Array<{ text: string; isRTL: boolean }> = [];
  const regex = /([\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u06D4\u061F\u060C\u061B]+|[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u06D4\u061F\u060C\u061B]+)/g;
  let match;

  while ((match = regex.exec(shaped)) !== null) {
    const chunk = match[0];
    const isRTL = containsUrdu(chunk);
    tokens.push({ text: chunk, isRTL });
  }

  // 3. For pure RTL tokens, reverse character sequence so LTR drawing on PDF canvas displays RTL
  const processedTokens = tokens.map((tok) => {
    if (tok.isRTL) {
      // Invert brackets inside Urdu runs
      const inverted = tok.text
        .replace(/\(/g, '\u0000')
        .replace(/\)/g, '(')
        .replace(/\u0000/g, ')')
        .replace(/\[/g, '\u0000')
        .replace(/\]/g, '[')
        .replace(/\u0000/g, ']');

      return Array.from(inverted).reverse().join('');
    }
    return tok.text;
  });

  // Reverse overall token sequence so the line flows Right-To-Left
  return processedTokens.reverse().join('');
}

/**
 * Robust line wrapper and formatter for Urdu paragraphs and multi-line questions in jsPDF.
 * Splits text into logical lines first based on measured text width, preserving the top-to-bottom
 * reading order, then formats each individual line for Right-To-Left display.
 */
export function splitAndFormatUrdu(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  prefix?: string
): string[] {
  if (!text) return [];

  const fullLogicalText = prefix ? `${prefix} ${text}` : text;
  if (!containsUrdu(fullLogicalText)) {
    return doc.splitTextToSize(fullLogicalText, maxWidth);
  }

  // Split by whitespace into logical words
  const words = fullLogicalText.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let currentLineWords: string[] = [];

  for (const word of words) {
    const candidateWords = [...currentLineWords, word];
    const candidateText = candidateWords.join(' ');
    const candidateFormatted = formatUrduTextForPdf(candidateText);
    const measuredWidth = doc.getTextWidth(candidateFormatted);

    if (measuredWidth > maxWidth && currentLineWords.length > 0) {
      lines.push(formatUrduTextForPdf(currentLineWords.join(' ')));
      currentLineWords = [word];
    } else {
      currentLineWords = candidateWords;
    }
  }

  if (currentLineWords.length > 0) {
    lines.push(formatUrduTextForPdf(currentLineWords.join(' ')));
  }

  return lines;
}
