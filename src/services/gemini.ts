import { Flashcard, MindMap, Podcast, VirtualPatient, Quiz, AudioPodcast } from "../types";
import { callAI, type RouterMessage, type Tier } from "./ai-router";

async function callOpenRouter(messages: any[], responseSchema?: any, tier: Tier = 'fast') {
  const routed: RouterMessage[] = messages.map(m => ({
    role: (m.role === 'assistant' || m.role === 'system' || m.role === 'user') ? m.role : 'user',
    content: m.content,
  }));
  return callAI({ tier, messages: routed, schema: responseSchema });
}

// ─── Flashcards ──────────────────────────────────────────────────────────────

export const generateFlashcards = async (
  subject: string,
  topic: string,
  materialText?: string,
  config?: GenerationConfig
): Promise<Flashcard[]> => {
  const schema = {
    type: "object",
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
            difficulty: { type: "integer", description: "1 (oson), 2 (o'rtacha), 3 (qiyin)" },
            hint: { type: "string" },
            source: { type: "string" }
          },
          required: ["question", "answer", "difficulty", "source"],
          additionalProperties: false
        }
      }
    },
    required: ["cards"],
    additionalProperties: false
  };

  const complexityText = config?.complexity === 'specialist' ? 'mutaxassis (high-level medical specialist) darajasida' : config?.complexity === 'basics' ? 'tibbiyot talabasi (basic science) darajasida' : 'klinik darajada';
  const quantity = config?.depth === 'deep' ? 15 : 8;

  const userContent = materialText
    ? `DIQQAT: Quyidagi berilgan material asosida "${subject}" fanidan "${topic}" bo'yicha ${quantity} ta flashcard yarating. 
       Qiyinlik darajasi: ${complexityText}. 
       Fokus: ${config?.focus || 'umumiy'}.
       Faqat ushbu materialdagi ma'lumotlardan foydalaning.\n\nMaterial:\n${materialText.slice(0, 40000)}\n\nO'zbek tilida.`
    : `"${subject}" fanidan "${topic}" bo'yicha ${quantity} ta flashcard yarating. Qiyinlik darajasi: ${complexityText}. Fokus: ${config?.focus || 'umumiy'}. Klinik qo'llash va tushunishni sinash kerak. O'zbek tilida.`;

  const data = await callOpenRouter([
    {
      role: "system",
      content: "Siz tibbiy ta'lim bo'yicha mutaxassisiz. Foydalanuvchi bergan mavzu asosida sifatli flashcardlar yarating."
    },
    { role: "user", content: userContent }
  ], schema);

  return data.cards;
};

// ─── Mind Map ─────────────────────────────────────────────────────────────────

export const generateMindMap = async (subject: string, topic: string, materialText?: string, config?: GenerationConfig): Promise<MindMap> => {
  const schema = {
    type: "object",
    properties: {
      center: { type: "string" },
      branches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            color: { type: "string", description: "Hex color code" },
            nodes: { type: "array", items: { type: "string" } }
          },
          required: ["label", "color", "nodes"],
          additionalProperties: false
        }
      }
    },
    required: ["center", "branches"],
    additionalProperties: false
  };

  const userContent = materialText
    ? `DIQQAT: Faqat quyidagi material asosida "${subject}" — "${topic}" uchun mantiqiy mind map yarating.\n\nMaterial:\n${materialText.slice(0, 30000)}\n\n4-6 tarmoq, o'zbek tilida. Ma'lumotlar aniq materialdan bo'lsin.`
    : `"${subject}" — "${topic}" uchun mind map yarating. 4-6 tarmoq, har birida 3-4 tugun. O'zbek tilida.`;

  return await callOpenRouter([
    {
      role: "system",
      content: "Mavzu bo'yicha mantiqiy mind map (tushunchalar xaritasi) yarating. O'zbek tilida."
    },
    {
      role: "user",
      content: userContent
    }
  ], schema);
};

// ─── Podcast ─────────────────────────────────────────────────────────────────

export const generatePodcast = async (topic: string): Promise<Podcast> => {
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      duration: { type: "string" },
      script: {
        type: "array",
        items: {
          type: "object",
          properties: {
            speaker: { type: "string", enum: ["MENTOR", "EKSPERT"] },
            text: { type: "string" }
          },
          required: ["speaker", "text"],
          additionalProperties: false
        }
      }
    },
    required: ["title", "duration", "script"],
    additionalProperties: false
  };

  return await callOpenRouter([
    {
      role: "system",
      content: "Siz tibbiy podcast ssenariychisisiz. MENTOR va EKSPERT o'rtasidagi suhbatni yarating. O'zbek tilida."
    },
    {
      role: "user",
      content: `"${topic}" mavzusida ikki nafar AI tibbiy ekspert (MENTOR va EKSPERT) o'rtasidagi chuqur tahliliy suhbat skriptini yarating.
      Ular mavzuni talaba uchun tushunarli, qiziqarli va ilmiy asoslangan holda muhokama qilishlari kerak.
      Suhbat NotebookLM uslubida bo'lsin. 6-8 navbat. O'zbek tilida.`
    }
  ], schema);
};

export const generatePodcastFromMaterial = async (topic: string, materialText: string): Promise<Podcast> => {
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      duration: { type: "string" },
      script: {
        type: "array",
        items: {
          type: "object",
          properties: {
            speaker: { type: "string", enum: ["SARDOR", "AZIZ"] },
            text: { type: "string" }
          },
          required: ["speaker", "text"],
          additionalProperties: false
        }
      }
    },
    required: ["title", "duration", "script"],
    additionalProperties: false
  };

  return await callOpenRouter([
    {
      role: "system",
      content: "Siz tibbiy podcast ssenariychisisiz. SARDOR (o'qituvchi) va AZIZ (talaba) suhbatini yarating. Klinik misollar bilan. O'zbek tilida. Faqat berilgan material mazmuni bo'yicha."
    },
    {
      role: "user",
      content: `DIQQAT: Faqat quyidagi material asosida "${topic}" mavzusida SARDOR va AZIZ o'rtasidagi suhbat skriptini yarating. Begona ma'lumot qo'shmang.\n\nMaterial:\n${materialText.slice(0, 40000)}\n\n6-8 navbat, klinik misollar bilan. O'zbek tilida.`
    }
  ], schema);
};

// ─── Virtual Patient ──────────────────────────────────────────────────────────

export const generateVirtualPatient = async (topic: string, materialText?: string, config?: GenerationConfig): Promise<VirtualPatient> => {
  const schema = {
    type: "object",
    properties: {
      patient: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          gender: { type: "string" },
          complaint: { type: "string" }
        },
        required: ["name", "age", "gender", "complaint"],
        additionalProperties: false
      },
      hidden_diagnosis: { type: "string" },
      difficulty: { type: "number" },
      opening: { type: "string" },
      evaluation: {
        type: "object",
        properties: {
          steps: { type: "array", items: { type: "string" } },
          key_mistakes: { type: "array", items: { type: "string" } }
        },
        required: ["steps", "key_mistakes"],
        additionalProperties: false
      }
    },
    required: ["patient", "hidden_diagnosis", "difficulty", "opening", "evaluation"],
    additionalProperties: false
  };

  const complexityText = config?.complexity === 'specialist' ? 'og\'ir va murakkab' : 'standart';
  
  const userContent = materialText
    ? `DIQQAT: Faqat quyidagi materialdagi holatlar asosida "${topic}" bilan bog'liq virtual bemor yarating. 
       Daraja: ${complexityText}. Fokus: ${config?.focus || 'umumiy'}.
       
       MUHIM QOIDA:
       1. "opening" maydonida bemorning shifokor xonasiga kirganda aytadigan ILK GAPLARI bo'lsin (masalan: "Ertalabdan beri ko'kragim achishib og'riyapti, doktor").
       2. Hech qachon shifokor rolida gapirmang.
       3. Bemor ismi materialdan olingan bo'lsin.
       
       Material:\n${materialText.slice(0, 30000)}\n\nO'zbek tilida.`
    : `"${topic}" bilan bog'liq virtual bemor case yarating (${complexityText}). 
       "opening" maydonida bemorning shifokorga ilk murojaati bo'lsin. O'zbek tilida.`;

  return await callOpenRouter([
    {
      role: "system",
      content: "Siz tibbiy simulyatsiya bo'yicha mutaxassisiz. Sizning vazifangiz - bemorni simulyatsiya qilish uchun ma'lumotlar bazasini yaratish. Siz HECH QACHON shifokor rolida gapirmaysiz. Siz bemor rolidasiz."
    },
    {
      role: "user",
      content: userContent
    }
  ], schema);
};

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export const generateQuiz = async (
  subject: string,
  topic: string,
  materialText?: string,
  config?: GenerationConfig
): Promise<Quiz> => {
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            correctAnswer: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["question", "options", "correctAnswer", "explanation"],
          additionalProperties: false
        }
      }
    },
    required: ["title", "questions"],
    additionalProperties: false
  };

  const userContent = materialText
    ? `DIQQAT: Faqat quyidagi material asosida "${subject}" fanidan 10 ta MCQ test savoli yarating. Har biri uchun 4 variant. O'zbek tilida.\n\nMaterial:\n${materialText.slice(0, 40000)}`
    : `"${subject}" fanidan "${topic}" bo'yicha 10 ta test savoli yarating. Har bir savol uchun 4 ta variant bo'lsin. O'zbek tilida.`;

  return await callOpenRouter([
    {
      role: "system",
      content: "Siz tibbiy testlar tuzuvchi mutaxassisiz. O'zbek tilida."
    },
    { role: "user", content: userContent }
  ], schema);
};

// ─── Audio Podcast ────────────────────────────────────────────────────────────

export const generateAudioPodcast = async (topic: string, materialText?: string): Promise<AudioPodcast> => {
  const podcastData = materialText 
    ? await generatePodcastFromMaterial(topic, materialText)
    : await generatePodcast(topic);
  return { ...podcastData, audioBase64: undefined };
};

// ─── Presentation (Slides) ────────────────────────────────────────────────────

export const generatePresentation = async (topic: string, materialText?: string, config?: GenerationConfig): Promise<Presentation> => {
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      slides: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "array", items: { type: "string" } },
            layout: {
              type: "string",
              enum: ["hero", "definition", "stat", "comparison", "list", "timeline", "warning", "insight", "grid", "case-study"]
            }
          },
          required: ["title", "content", "layout"],
          additionalProperties: false
        }
      }
    },
    required: ["title", "slides"],
    additionalProperties: false
  };

  const slidesCount = config?.depth === 'deep' ? 12 : 8;
  const isSpecialist = config?.complexity === 'specialist';

  const systemPrompt = `Siz world-class tibbiy ta'lim prezentatsiyalari yaratuvchi mutaxassisiz.
Maqsad: Google NotebookLM yoki TED-talk darajasida VIZUAL VA TA'SIRCHAN slaydlar.

MUHIM QOIDALAR:
1. Har slaydda MAKSIMUM 4 element (content array). Ko'p emas.
2. "stat" layoutda ALBATTA real raqamlar ishlat: "Jahon kasalligi: 1.5 MLRD", "O'lim xavfi: 60%", "5 yillik omon qolish: 20-40%"
3. "hero" layout faqat birinchi slayd uchun — kuchli sarlavha + 1 ta zarba beruvchi fakt
4. "insight" layout — eng muhim bir xulosa, "..." qoshtirnoqda yozilsin
5. "definition" layoutda — qisqa, aniq, kuchli ta'rif (max 2 gap)
6. "warning" layoutda — jiddiy klinik ogohlantirish (max 3 element)
7. "case-study" layoutda — content[0] klinik holat, content[1] xulosa/tashxis
8. "timeline" layoutda — ketma-ket bosqichlar (patogenez, davolash bosqichlari)
9. "comparison" layoutda — ikki tomon, har biri 2-3 element
10. "grid" layoutda — 4 ta qisqa, mustaqil fakt

SLAYD TARTIBI: hero → definition → stat → [mavzuga mos layoutlar] → insight (xulosa)
${isSpecialist ? 'Daraja: mutaxassis (USMLE Step 2-3, klinik fikrlash)' : 'Daraja: tibbiyot talabasi (aniq, tushunarli, klinik qo\'llash)'}
Fokus: ${config?.focus || 'umumiy klinik'}
Til: O'zbek tili (professional tibbiy terminlar bilan)`;

  const userContent = materialText
    ? `"${topic}" mavzusida ${slidesCount} ta PROFESSIONAL slayd yarating.
FAQAT quyidagi materialdan foydalaning — statistikalar, ta'riflar, klinik ma'lumotlar shu materialdan bo'lsin.

Material:
${materialText.slice(0, 45000)}`
    : `"${topic}" mavzusida ${slidesCount} ta PROFESSIONAL slayd yarating.
Tibbiy statistikalar, klinik faktlar, real raqamlar bilan boyiting. Har slayd mustaqil va ta'sirchan bo'lsin.`;

  return await callOpenRouter([
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent }
  ], schema);
};

// ─── Chat with Patient ───────────────────────────────────────────────────────

export const chatWithPatient = async (
  patient: VirtualPatient,
  history: { role: 'user' | 'model', text: string }[],
  message: string
): Promise<string> => {
  const systemInstruction = `DIQQAT: SIZ BEMORSIZ. HECH QACHON BU ROLDAN CHIQMANG.
Siz ${patient.patient.age} yoshli, ${patient.patient.gender}, "${patient.patient.complaint}" shikoyati bilan kelgan ${patient.patient.name} ismli bemorsiz.
Yashirin tashxisingiz (faqat o'zingiz uchun): ${patient.hidden_diagnosis}

QOIDALAR:
1. FAQAT BEMOR SIFATIDA JAVOB BERING. Shifokor kabi salomlashmang (masalan: "Assalomu alaykum, sizga qanday yordam bera olaman?" - DEYISH TAQIQLANADI).
2. Siz shifokorga yordam so'rab keldingiz. 
3. Diagnozni o'zingiz aytmang. Faqat simptomlarni va his-tuyg'ularingizni oddiy tilda (tibbiy terminsiz) tushuntiring.
4. Agar shifokor qo'pol gapirsa yoki noto'g'ri ish qilsa, bemor kabi xavotirlaning.
5. FAQAT O'ZBEK TILIDA GAPIRING.`;

  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
    { role: 'user', content: message }
  ];

  return await callOpenRouter(messages);
};

// ─── Generate Test Result ─────────────────────────────────────────────────────

export const generateTestResult = async (
  patient: VirtualPatient,
  testType: string
): Promise<string> => {
  return await callOpenRouter([
    {
      role: "system",
      content: "Siz tibbiy laboratoriya va instrumental tekshiruv natijalari generatoriisiz. Bemorning yashirin tashxisiga mos realistik qisqa natija bering. O'zbek tilida. Faqat natija raqamlar va tavsif bilan."
    },
    {
      role: "user",
      content: `Bemor: ${patient.patient.name}, ${patient.patient.age} yosh, ${patient.patient.gender}. Shikoyat: ${patient.patient.complaint}. Yashirin tashxis: ${patient.hidden_diagnosis}.\n\nBuyurilgan: ${testType}\n\nNatijani bering (2-4 qator, klinik ko'rsatkichlar bilan). O'zbek tilida.`
    }
  ]);
};

// ─── Evaluate Diagnosis (5 metrics, each 0–20) ───────────────────────────────

export interface EvaluationResult {
  score: number;
  feedback: string;
  breakdown: {
    anamnesis: number;   // 0–20
    examination: number; // 0–20
    diagnosis: number;   // 0–20
    treatment: number;   // 0–20
    safety: number;      // 0–20
  };
  weak_topic?: string;
}

export const evaluateDiagnosis = async (
  patient: VirtualPatient,
  history: { role: 'user' | 'model', text: string }[],
  diagnosis: string
): Promise<EvaluationResult> => {
  const schema = {
    type: "object",
    properties: {
      score: { type: "number" },
      feedback: { type: "string" },
      weak_topic: { type: "string" },
      breakdown: {
        type: "object",
        properties: {
          anamnesis:   { type: "number" },
          examination: { type: "number" },
          diagnosis:   { type: "number" },
          treatment:   { type: "number" },
          safety:      { type: "number" }
        },
        required: ["anamnesis", "examination", "diagnosis", "treatment", "safety"],
        additionalProperties: false
      }
    },
    required: ["score", "feedback", "breakdown"],
    additionalProperties: false
  };

  return await callOpenRouter([
    {
      role: "system",
      content: "Siz tibbiy natijalarni baholovchi ekspertsiz. 5 mezon bo'yicha 0-20 ball bering. O'zbek tilida."
    },
    {
      role: "user",
      content: `Bemor: ${JSON.stringify(patient.patient)}.
Yashirin tashxis: ${patient.hidden_diagnosis}.
Suhbat tarixi: ${JSON.stringify(history.slice(-10))}.
Talabaning qo'ygan tashxisi: ${diagnosis}.

Ushbu tashxisni 5 mezon bo'yicha baholang (har biri 0-20 ball):
1. anamnesis - anamnez yig'ish sifati
2. examination - tekshiruv buyurish to'g'riligi
3. diagnosis - tashxis aniqligi
4. treatment - davo rejasining to'g'riligi
5. safety - bemorning xavfsizligi hisobga olinishi

weak_topic: qaysi tibbiy mavzuni chuqurroq o'rganish kerak (qisqa, masalan: "Miokard infarkti")
O'zbek tilida.`
    }
  ], schema);
};

// ─── DDx (Differential Diagnosis) Generator ──────────────────────────────────

export interface DDxItem {
  diagnosis: string;
  probability: number;   // 0–100
  reasoning: string;
  key_finding: string;
}

export const generateDDx = async (
  patient: VirtualPatient,
  chatHistory: { role: 'user' | 'model'; text: string; isTest?: boolean }[],
  orderedTests: string[]
): Promise<DDxItem[]> => {
  const schema = {
    type: "object",
    properties: {
      ddx: {
        type: "array",
        items: {
          type: "object",
          properties: {
            diagnosis:   { type: "string" },
            probability: { type: "number", description: "0-100 foizda ehtimollik" },
            reasoning:   { type: "string", description: "1 jumlali asoslama" },
            key_finding: { type: "string", description: "Bu tashxisni ko'rsatuvchi asosiy belgi" }
          },
          required: ["diagnosis", "probability", "reasoning", "key_finding"],
          additionalProperties: false
        }
      }
    },
    required: ["ddx"],
    additionalProperties: false
  };

  const conversationSummary = chatHistory
    .filter(m => !m.isTest)
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'Shifokor' : 'Bemor'}: ${m.text}`)
    .join('\n');

  const testsSummary = chatHistory
    .filter(m => m.isTest)
    .slice(-4)
    .map(m => m.text)
    .join('\n');

  const data = await callOpenRouter([
    {
      role: "system",
      content: "Siz klinik diagnostika bo'yicha ekspertsiz. Berilgan ma'lumotlar asosida 4 ta eng ehtimoliy differentsial tashxis tuzib, ehtimollikni foizda ko'rsating. O'zbek tilida."
    },
    {
      role: "user",
      content: `Bemor ma'lumotlari:
Ismi: ${patient.patient.name}, ${patient.patient.age} yosh, ${patient.patient.gender}
Asosiy shikoyat: ${patient.patient.complaint}

Oldingi suhbat:
${conversationSummary || '(hali suhbat bo\'lmadi)'}

Buyurilgan testlar natijalari:
${testsSummary || '(hali test buyurilmadi)'}

Buyurilgan testlar: ${orderedTests.length > 0 ? orderedTests.join(', ') : 'yo\'q'}

Ushbu ma'lumotlar asosida 4 ta differentsial tashxis tuzib, har birining ehtimolligini 0-100 foizda ko'rsating. O'zbek tilida.`
    }
  ], schema, 'reason');

  return (data as any).ddx as DDxItem[];
};

