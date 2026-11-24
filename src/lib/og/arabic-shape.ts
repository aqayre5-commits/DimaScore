/**
 * Arabic contextual shaping for OG images, done before Satori sees the text.
 *
 * Satori draws Arabic with its joined forms (opentype.js GSUB), but it measures each word with the
 * unjoined, isolated glyph widths, which are wider. Every Arabic word box came out too wide and the
 * extra width showed up as big gaps between words. Here each letter is replaced by its Unicode
 * presentation form (isolated / final / initial / medial, plus the lam-alef ligatures), so the glyph
 * Satori measures is the glyph it draws. Presentation forms are not reordered by Satori, so the
 * caller lays them out in visual (right-to-left) order: see `visualArabic`.
 *
 * Harakat (short-vowel marks) are dropped: without GPOS they would not sit on their letter. Team,
 * competition and label strings on the site don't use them.
 */

// [isolated, final, initial, medial]; 0 = no such form (the letter does not join to the next one).
// Generated from UnicodeData decompositions (<isolated>/<final>/<initial>/<medial>).
const FORMS = new Map<number, readonly [number, number, number, number]>([
  [0x0621, [0xfe80, 0x0000, 0x0000, 0x0000]], // ARABIC LETTER HAMZA
  [0x0622, [0xfe81, 0xfe82, 0x0000, 0x0000]], // ARABIC LETTER ALEF WITH MADDA ABOVE
  [0x0623, [0xfe83, 0xfe84, 0x0000, 0x0000]], // ARABIC LETTER ALEF WITH HAMZA ABOVE
  [0x0624, [0xfe85, 0xfe86, 0x0000, 0x0000]], // ARABIC LETTER WAW WITH HAMZA ABOVE
  [0x0625, [0xfe87, 0xfe88, 0x0000, 0x0000]], // ARABIC LETTER ALEF WITH HAMZA BELOW
  [0x0626, [0xfe89, 0xfe8a, 0xfe8b, 0xfe8c]], // ARABIC LETTER YEH WITH HAMZA ABOVE
  [0x0627, [0xfe8d, 0xfe8e, 0x0000, 0x0000]], // ARABIC LETTER ALEF
  [0x0628, [0xfe8f, 0xfe90, 0xfe91, 0xfe92]], // ARABIC LETTER BEH
  [0x0629, [0xfe93, 0xfe94, 0x0000, 0x0000]], // ARABIC LETTER TEH MARBUTA
  [0x062a, [0xfe95, 0xfe96, 0xfe97, 0xfe98]], // ARABIC LETTER TEH
  [0x062b, [0xfe99, 0xfe9a, 0xfe9b, 0xfe9c]], // ARABIC LETTER THEH
  [0x062c, [0xfe9d, 0xfe9e, 0xfe9f, 0xfea0]], // ARABIC LETTER JEEM
  [0x062d, [0xfea1, 0xfea2, 0xfea3, 0xfea4]], // ARABIC LETTER HAH
  [0x062e, [0xfea5, 0xfea6, 0xfea7, 0xfea8]], // ARABIC LETTER KHAH
  [0x062f, [0xfea9, 0xfeaa, 0x0000, 0x0000]], // ARABIC LETTER DAL
  [0x0630, [0xfeab, 0xfeac, 0x0000, 0x0000]], // ARABIC LETTER THAL
  [0x0631, [0xfead, 0xfeae, 0x0000, 0x0000]], // ARABIC LETTER REH
  [0x0632, [0xfeaf, 0xfeb0, 0x0000, 0x0000]], // ARABIC LETTER ZAIN
  [0x0633, [0xfeb1, 0xfeb2, 0xfeb3, 0xfeb4]], // ARABIC LETTER SEEN
  [0x0634, [0xfeb5, 0xfeb6, 0xfeb7, 0xfeb8]], // ARABIC LETTER SHEEN
  [0x0635, [0xfeb9, 0xfeba, 0xfebb, 0xfebc]], // ARABIC LETTER SAD
  [0x0636, [0xfebd, 0xfebe, 0xfebf, 0xfec0]], // ARABIC LETTER DAD
  [0x0637, [0xfec1, 0xfec2, 0xfec3, 0xfec4]], // ARABIC LETTER TAH
  [0x0638, [0xfec5, 0xfec6, 0xfec7, 0xfec8]], // ARABIC LETTER ZAH
  [0x0639, [0xfec9, 0xfeca, 0xfecb, 0xfecc]], // ARABIC LETTER AIN
  [0x063a, [0xfecd, 0xfece, 0xfecf, 0xfed0]], // ARABIC LETTER GHAIN
  [0x0641, [0xfed1, 0xfed2, 0xfed3, 0xfed4]], // ARABIC LETTER FEH
  [0x0642, [0xfed5, 0xfed6, 0xfed7, 0xfed8]], // ARABIC LETTER QAF
  [0x0643, [0xfed9, 0xfeda, 0xfedb, 0xfedc]], // ARABIC LETTER KAF
  [0x0644, [0xfedd, 0xfede, 0xfedf, 0xfee0]], // ARABIC LETTER LAM
  [0x0645, [0xfee1, 0xfee2, 0xfee3, 0xfee4]], // ARABIC LETTER MEEM
  [0x0646, [0xfee5, 0xfee6, 0xfee7, 0xfee8]], // ARABIC LETTER NOON
  [0x0647, [0xfee9, 0xfeea, 0xfeeb, 0xfeec]], // ARABIC LETTER HEH
  [0x0648, [0xfeed, 0xfeee, 0x0000, 0x0000]], // ARABIC LETTER WAW
  [0x0649, [0xfeef, 0xfef0, 0xfbe8, 0xfbe9]], // ARABIC LETTER ALEF MAKSURA
  [0x064a, [0xfef1, 0xfef2, 0xfef3, 0xfef4]], // ARABIC LETTER YEH
  [0x0671, [0xfb50, 0xfb51, 0x0000, 0x0000]], // ARABIC LETTER ALEF WASLA
  [0x0677, [0xfbdd, 0x0000, 0x0000, 0x0000]], // ARABIC LETTER U WITH HAMZA ABOVE
  [0x0679, [0xfb66, 0xfb67, 0xfb68, 0xfb69]], // ARABIC LETTER TTEH
  [0x067a, [0xfb5e, 0xfb5f, 0xfb60, 0xfb61]], // ARABIC LETTER TTEHEH
  [0x067b, [0xfb52, 0xfb53, 0xfb54, 0xfb55]], // ARABIC LETTER BEEH
  [0x067e, [0xfb56, 0xfb57, 0xfb58, 0xfb59]], // ARABIC LETTER PEH
  [0x067f, [0xfb62, 0xfb63, 0xfb64, 0xfb65]], // ARABIC LETTER TEHEH
  [0x0680, [0xfb5a, 0xfb5b, 0xfb5c, 0xfb5d]], // ARABIC LETTER BEHEH
  [0x0683, [0xfb76, 0xfb77, 0xfb78, 0xfb79]], // ARABIC LETTER NYEH
  [0x0684, [0xfb72, 0xfb73, 0xfb74, 0xfb75]], // ARABIC LETTER DYEH
  [0x0686, [0xfb7a, 0xfb7b, 0xfb7c, 0xfb7d]], // ARABIC LETTER TCHEH
  [0x0687, [0xfb7e, 0xfb7f, 0xfb80, 0xfb81]], // ARABIC LETTER TCHEHEH
  [0x0688, [0xfb88, 0xfb89, 0x0000, 0x0000]], // ARABIC LETTER DDAL
  [0x068c, [0xfb84, 0xfb85, 0x0000, 0x0000]], // ARABIC LETTER DAHAL
  [0x068d, [0xfb82, 0xfb83, 0x0000, 0x0000]], // ARABIC LETTER DDAHAL
  [0x068e, [0xfb86, 0xfb87, 0x0000, 0x0000]], // ARABIC LETTER DUL
  [0x0691, [0xfb8c, 0xfb8d, 0x0000, 0x0000]], // ARABIC LETTER RREH
  [0x0698, [0xfb8a, 0xfb8b, 0x0000, 0x0000]], // ARABIC LETTER JEH
  [0x06a4, [0xfb6a, 0xfb6b, 0xfb6c, 0xfb6d]], // ARABIC LETTER VEH
  [0x06a6, [0xfb6e, 0xfb6f, 0xfb70, 0xfb71]], // ARABIC LETTER PEHEH
  [0x06a9, [0xfb8e, 0xfb8f, 0xfb90, 0xfb91]], // ARABIC LETTER KEHEH
  [0x06ad, [0xfbd3, 0xfbd4, 0xfbd5, 0xfbd6]], // ARABIC LETTER NG
  [0x06af, [0xfb92, 0xfb93, 0xfb94, 0xfb95]], // ARABIC LETTER GAF
  [0x06b1, [0xfb9a, 0xfb9b, 0xfb9c, 0xfb9d]], // ARABIC LETTER NGOEH
  [0x06b3, [0xfb96, 0xfb97, 0xfb98, 0xfb99]], // ARABIC LETTER GUEH
  [0x06ba, [0xfb9e, 0xfb9f, 0x0000, 0x0000]], // ARABIC LETTER NOON GHUNNA
  [0x06bb, [0xfba0, 0xfba1, 0xfba2, 0xfba3]], // ARABIC LETTER RNOON
  [0x06be, [0xfbaa, 0xfbab, 0xfbac, 0xfbad]], // ARABIC LETTER HEH DOACHASHMEE
  [0x06c0, [0xfba4, 0xfba5, 0x0000, 0x0000]], // ARABIC LETTER HEH WITH YEH ABOVE
  [0x06c1, [0xfba6, 0xfba7, 0xfba8, 0xfba9]], // ARABIC LETTER HEH GOAL
  [0x06c5, [0xfbe0, 0xfbe1, 0x0000, 0x0000]], // ARABIC LETTER KIRGHIZ OE
  [0x06c6, [0xfbd9, 0xfbda, 0x0000, 0x0000]], // ARABIC LETTER OE
  [0x06c7, [0xfbd7, 0xfbd8, 0x0000, 0x0000]], // ARABIC LETTER U
  [0x06c8, [0xfbdb, 0xfbdc, 0x0000, 0x0000]], // ARABIC LETTER YU
  [0x06c9, [0xfbe2, 0xfbe3, 0x0000, 0x0000]], // ARABIC LETTER KIRGHIZ YU
  [0x06cb, [0xfbde, 0xfbdf, 0x0000, 0x0000]], // ARABIC LETTER VE
  [0x06cc, [0xfbfc, 0xfbfd, 0xfbfe, 0xfbff]], // ARABIC LETTER FARSI YEH
  [0x06d0, [0xfbe4, 0xfbe5, 0xfbe6, 0xfbe7]], // ARABIC LETTER E
  [0x06d2, [0xfbae, 0xfbaf, 0x0000, 0x0000]], // ARABIC LETTER YEH BARREE
  [0x06d3, [0xfbb0, 0xfbb1, 0x0000, 0x0000]], // ARABIC LETTER YEH BARREE WITH HAMZA ABOVE
]);

const LAM = 0x0644;
// alef variant -> [isolated, final] lam-alef ligature
const LAM_ALEF = new Map<number, readonly [number, number]>([
  [0x0622, [0xfef5, 0xfef6]],
  [0x0623, [0xfef7, 0xfef8]],
  [0x0625, [0xfef9, 0xfefa]],
  [0x0627, [0xfefb, 0xfefc]],
]);
const TATWEEL = 0x0640;
const HARAKAT = /[\u064B-\u065F\u0670]/g;

type Joining = 'D' | 'R' | 'C' | 'U';
function joining(cp: number): Joining {
  if (cp === TATWEEL || cp === 0x200d) return 'C';
  const f = FORMS.get(cp);
  if (!f) return 'U';
  return f[2] ? 'D' : 'R';
}
const joinsForward = (j: Joining | undefined) => j === 'D' || j === 'C';
const joinsBackward = (j: Joining | undefined) => j === 'D' || j === 'R' || j === 'C';

/** Logical-order Arabic -> logical-order presentation forms (see the file comment). */
export function shapeArabic(text: string): string {
  const cps = [...text.replace(HARAKAT, '')].map((c) => c.codePointAt(0)!);
  // Merge lam + alef into one ligature unit first; it joins backward only.
  const units: { cp: number; lig?: readonly [number, number] }[] = [];
  for (let i = 0; i < cps.length; i++) {
    const lig = cps[i] === LAM ? LAM_ALEF.get(cps[i + 1]) : undefined;
    if (lig) {
      units.push({ cp: LAM, lig });
      i++;
    } else units.push({ cp: cps[i] });
  }
  const types = units.map((u) => (u.lig ? 'R' : joining(u.cp)) as Joining);
  let out = '';
  units.forEach((u, i) => {
    const prev = joinsForward(types[i - 1]) && joinsBackward(types[i]);
    if (u.lig) {
      out += String.fromCodePoint(prev ? u.lig[1] : u.lig[0]);
      return;
    }
    const f = FORMS.get(u.cp);
    if (!f) {
      out += String.fromCodePoint(u.cp);
      return;
    }
    const next = types[i] === 'D' && joinsBackward(types[i + 1]);
    const form = prev && next ? f[3] : prev ? f[1] : next ? f[2] : f[0];
    out += String.fromCodePoint(form || f[0]);
  });
  return out;
}

const ARABIC_SEQ = /[\u0600-\u06FF\u200C\u200D]+/g;

/**
 * For a word that is already in visual order apart from its Arabic letters (see ogRuns): shape each
 * Arabic letter sequence and reverse it, so Satori, which draws left to right, shows it correctly.
 */
export function visualArabic(text: string): string {
  return text.replace(ARABIC_SEQ, (seq) => [...shapeArabic(seq)].reverse().join(''));
}
