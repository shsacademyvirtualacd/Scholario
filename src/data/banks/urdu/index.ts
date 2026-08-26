import type { StoredMCQ } from "../../../types/questionBank";
import ch01 from "./ch01.json";
import ch02 from "./ch02.json";
import ch03 from "./ch03.json";
import ch04 from "./ch04.json";
import ch05 from "./ch05.json";
import ch06 from "./ch06.json";
import ch07 from "./ch07.json";
import ch08 from "./ch08.json";
import ch09 from "./ch09.json";
import ch10 from "./ch10.json";
import ch11 from "./ch11.json";
import ch12 from "./ch12.json";
import ch13 from "./ch13.json";
import ch14 from "./ch14.json";
import ch15 from "./ch15.json";
import ch16 from "./ch16.json";
import ch17 from "./ch17.json";
import ch18 from "./ch18.json";
import ch19 from "./ch19.json";
import ch20 from "./ch20.json";
import ch21 from "./ch21.json";
import ch22 from "./ch22.json";

export const urdu: Record<string, StoredMCQ[]> = {
  "الفاظ کی اقسام": ch01 as unknown as StoredMCQ[],
  "تذکیر و تانیث": ch02 as unknown as StoredMCQ[],
  "واحد و جمع": ch03 as unknown as StoredMCQ[],
  "مترادف الفاظ": ch04 as unknown as StoredMCQ[],
  "متضاد الفاظ": ch05 as unknown as StoredMCQ[],
  "محاورات": ch06 as unknown as StoredMCQ[],
  "ضرب الامثال": ch07 as unknown as StoredMCQ[],
  "جملوں کی اقسام": ch08 as unknown as StoredMCQ[],
  "قواعد املا": ch09 as unknown as StoredMCQ[],
  "حروفِ ربط اور حروفِ عطف": ch10 as unknown as StoredMCQ[],
  "تشبیہ": ch11 as unknown as StoredMCQ[],
  "استعارہ": ch12 as unknown as StoredMCQ[],
  "تلمیح": ch13 as unknown as StoredMCQ[],
  "مبالغہ": ch14 as unknown as StoredMCQ[],
  "تضاد": ch15 as unknown as StoredMCQ[],
  "تجنیس تام و ناقص": ch16 as unknown as StoredMCQ[],
  "مراعات النظیر": ch17 as unknown as StoredMCQ[],
  "حسنِ تعلیل": ch18 as unknown as StoredMCQ[],
  "لف و نشر": ch19 as unknown as StoredMCQ[],
  "تجاہلِ عارفانہ": ch20 as unknown as StoredMCQ[],
  "سوال و جواب": ch21 as unknown as StoredMCQ[],
  "ایہام": ch22 as unknown as StoredMCQ[],
};

export default urdu;
