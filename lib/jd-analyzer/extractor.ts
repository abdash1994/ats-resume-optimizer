import type { JobContext, RoleCategory, ExperienceLevel } from '@/types/resume';
import roleKeywordsData from '@/data/role-keywords.json';

const roleKeywords = roleKeywordsData as Record<string, Record<string, string[]>>;

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'shall', 'can', 'not', 'no', 'nor', 'so', 'yet', 'both', 'either',
  'this', 'that', 'these', 'those', 'we', 'you', 'he', 'she', 'it', 'they',
  'their', 'our', 'your', 'my', 'his', 'her', 'its', 'if', 'as', 'than',
  'then', 'when', 'where', 'while', 'although', 'though', 'also', 'such',
  'including', 'across', 'within', 'must', 'required', 'preferred', 'etc',
  'strong', 'excellent', 'good', 'great', 'ability', 'experience', 'work',
  'team', 'company', 'join', 'looking', 'seeking', 'opportunity', 'role',
  'position', 'job', 'apply', 'candidate', 'ideal', 'plus', 'bonus',
]);

export interface ExtractedJDData {
  requiredKeywords: string[];
  preferredKeywords: string[];
  allKeywords: string[];
  requiredYears?: number;
  detectedLevel: ExperienceLevel;
  detectedCategory: RoleCategory;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
}

function tokenize(text: string): string[] {
  return text
    .replace(/[^\w\s.#+]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()));
}

function computeTFIDF(text: string): Map<string, number> {
  const words = tokenize(text);
  const freq = new Map<string, number>();

  for (const word of words) {
    const lower = word.toLowerCase();
    freq.set(lower, (freq.get(lower) || 0) + 1);
  }

  const maxFreq = Math.max(...freq.values());
  const tfidf = new Map<string, number>();

  for (const [word, count] of freq) {
    tfidf.set(word, count / maxFreq);
  }

  return tfidf;
}

function extractMultiWordTerms(text: string): string[] {
  const multiWordPatterns = [
    // Programming / tech
    /\b(machine learning|deep learning|natural language processing|computer vision|data science|software engineering|product management|project management|business development|customer success|supply chain|user experience|user interface|full stack|back.?end|front.?end|ci\/cd|devops|test.?driven development|agile scrum)\b/gi,
    // Tools & platforms
    /\b(google analytics|google ads|microsoft azure|amazon web services|google cloud|power bi|tableau desktop|microsoft office|adobe creative|github actions|azure devops|aws lambda|apache spark|apache kafka)\b/gi,
    // Frameworks
    /\b(react\.js|node\.js|next\.js|vue\.js|angular\.js|spring boot|django rest|express\.js|ruby on rails)\b/gi,
  ];

  const found: string[] = [];
  for (const pattern of multiWordPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      found.push(match[0].trim());
    }
  }

  return [...new Set(found.map(t => t.replace(/\s+/g, ' ')))];
}

function detectExperienceLevel(text: string): ExperienceLevel {
  const lower = text.toLowerCase();

  if (/chief|c-?suite|c.?level|vp of|vice president/.test(lower)) return 'c-suite';
  if (/vp\b|vice president/.test(lower)) return 'vp';
  if (/director of|director,|head of/.test(lower)) return 'director';
  if (/staff engineer|principal engineer|staff .* engineer/.test(lower)) return 'staff';
  if (/senior|sr\.|lead |tech lead|team lead/.test(lower)) return 'senior';
  if (/mid.?level|mid.?senior|3.{0,5}years|4.{0,5}years|5.{0,5}years/.test(lower)) return 'mid';
  if (/junior|entry.?level|associate|0.{0,5}years|1.{0,5}years|2.{0,5}years|new grad|graduate/.test(lower)) return 'junior';

  return 'mid';
}

function detectRoleCategory(text: string, role: string): RoleCategory {
  const combined = (text + ' ' + role).toLowerCase();

  if (/software|engineer|developer|devops|sre|backend|frontend|full.?stack|devops|platform|mobile|ios|android/.test(combined)) return 'software-engineering';
  if (/data scientist|machine learning|ml engineer|ai engineer|data analyst|analytics|data engineer/.test(combined)) return 'data-science';
  if (/product manager|pm\b|product owner|po\b|product lead/.test(combined)) return 'product-management';
  if (/design|ux|ui|user experience|user interface|creative/.test(combined)) return 'design';
  if (/finance|accounting|financial|cfo|controller|analyst.*finance|fp&a/.test(combined)) return 'finance';
  if (/marketing|growth|seo|content|brand|demand gen|cmo/.test(combined)) return 'marketing';
  if (/sales|account executive|business development|bdr|sdr|ae\b|cro\b/.test(combined)) return 'sales';
  if (/hr\b|human resources|people|talent|recruiter|hrbp/.test(combined)) return 'hr';
  if (/legal|counsel|attorney|compliance|paralegal|lawyer/.test(combined)) return 'legal';
  if (/nurse|doctor|physician|clinical|medical|healthcare|health/.test(combined)) return 'healthcare';
  if (/operations|ops|supply chain|logistics|process|coo/.test(combined)) return 'operations';
  if (/customer success|csm|account manager|support|cx\b/.test(combined)) return 'customer-success';

  return 'other';
}

function extractYearsRequired(text: string): number | undefined {
  const match = text.match(/(\d+)\+?\s*(?:to\s*\d+)?\s*years?\s+(?:of\s+)?(?:experience|exp)/i);
  return match ? parseInt(match[1]) : undefined;
}

function splitRequiredVsPreferred(jdText: string): { required: string; preferred: string } {
  const lines = jdText.split('\n');
  let required = '';
  let preferred = '';
  let inPreferred = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/nice.to.have|preferred|bonus|plus|desired|ideal/.test(lower)) {
      inPreferred = true;
    } else if (/required|must have|qualifications|requirements|you (will|should|must)/.test(lower)) {
      inPreferred = false;
    }

    if (inPreferred) {
      preferred += line + '\n';
    } else {
      required += line + '\n';
    }
  }

  return { required, preferred };
}

function extractBulletPoints(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^[•\-\*\d+\.]\s+/, '').trim())
    .filter(l => l.length > 20);
}

export function analyzeJD(jdText: string, role: string): ExtractedJDData {
  const { required, preferred } = splitRequiredVsPreferred(jdText);
  const allText = jdText;

  const tfidfScores = computeTFIDF(allText);
  const multiWordTerms = extractMultiWordTerms(allText);

  // Combine single tokens and multi-word terms
  const candidateKeywords = new Map<string, number>();

  for (const [word, score] of tfidfScores) {
    if (word.length > 2 && score > 0.1) {
      candidateKeywords.set(word, score);
    }
  }

  for (const term of multiWordTerms) {
    candidateKeywords.set(term.toLowerCase(), 1.5);
  }

  const detectedCategory = detectRoleCategory(allText, role);
  const detectedLevel = detectExperienceLevel(allText);
  const requiredYears = extractYearsRequired(allText);

  // Get role-specific keywords to boost
  const roleData = roleKeywords[detectedCategory];
  const levelKey = detectedLevel === 'junior' ? 'entry' : detectedLevel;
  const coreSkills = (roleData?.core_skills || []).map((s: string) => s.toLowerCase());
  const levelSkills = ((roleData as Record<string, string[]>)?.[levelKey] || []).map((s: string) => s.toLowerCase());

  // Score each candidate keyword
  const scored: Array<{ keyword: string; score: number; section: 'required' | 'preferred' }> = [];

  for (const [keyword, baseScore] of candidateKeywords) {
    const inCore = coreSkills.some(s => s.includes(keyword) || keyword.includes(s));
    const inLevel = levelSkills.some(s => s.includes(keyword) || keyword.includes(s));
    const inRequired = required.toLowerCase().includes(keyword);
    const inPreferred = preferred.toLowerCase().includes(keyword);

    const finalScore = baseScore * (inCore ? 2 : 1) * (inLevel ? 1.5 : 1);
    const section = inRequired ? 'required' : 'preferred';

    if (inRequired || inPreferred || inCore || inLevel) {
      scored.push({ keyword, score: finalScore, section });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const top50 = scored.slice(0, 50);
  const requiredKeywords = top50
    .filter(k => k.section === 'required')
    .map(k => k.keyword)
    .slice(0, 25);
  const preferredKeywords = top50
    .filter(k => k.section === 'preferred')
    .map(k => k.keyword)
    .slice(0, 25);

  return {
    requiredKeywords,
    preferredKeywords,
    allKeywords: [...new Set([...requiredKeywords, ...preferredKeywords])],
    requiredYears,
    detectedLevel,
    detectedCategory,
    responsibilities: extractBulletPoints(required).slice(0, 10),
    requirements: extractBulletPoints(required).slice(0, 10),
    niceToHave: extractBulletPoints(preferred).slice(0, 8),
  };
}
