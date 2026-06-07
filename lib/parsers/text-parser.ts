import type { ResumeData, ContactInfo, WorkExperience, Education } from '@/types/resume';
import sectionNamesData from '@/data/section-names.json';

const { canonical_sections } = sectionNamesData;

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function extractEmail(text: string): string {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

function extractPhone(text: string): string {
  const match = text.match(/(\+?[\d\s\-().]{7,20})/);
  if (!match) return '';
  const cleaned = match[0].replace(/\s+/g, ' ').trim();
  // Must contain at least 7 digits
  if ((cleaned.match(/\d/g) || []).length < 7) return '';
  return cleaned;
}

function extractLinkedIn(text: string): string {
  const match = text.match(/linkedin\.com\/in\/[\w-]+/i);
  return match ? `https://${match[0]}` : '';
}

function extractGitHub(text: string): string {
  const match = text.match(/github\.com\/[\w-]+/i);
  return match ? `https://${match[0]}` : '';
}

function extractPortfolio(text: string): string {
  const match = text.match(/https?:\/\/(?!linkedin|github)[\w.-]+\.[a-zA-Z]{2,}(?:\/[\w.-]*)?/i);
  return match ? match[0] : '';
}

function extractLocation(text: string): string {
  // Look for City, State or City, Country patterns
  const match = text.match(/([A-Z][a-zA-Z\s]+),\s*([A-Z]{2,}|[A-Z][a-zA-Z\s]+)/);
  return match ? match[0] : '';
}

function identifySectionType(heading: string): string | null {
  const lower = heading.toLowerCase().trim();

  for (const [sectionKey, section] of Object.entries(canonical_sections)) {
    if (section.aliases.some(alias => lower.includes(alias) || alias.includes(lower))) {
      return sectionKey;
    }
  }
  return null;
}

function isDateRange(line: string): boolean {
  return /\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current/i.test(line);
}

function isSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 80) return false;
  if (trimmed.length < 3) return false;

  // All caps heading
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) return true;

  // Check against known section aliases
  const lower = trimmed.toLowerCase();
  for (const section of Object.values(canonical_sections)) {
    if (section.aliases.some(alias => lower === alias || lower === alias + ':')) {
      return true;
    }
  }

  // Title case short line (likely a heading)
  if (trimmed.length < 40 && /^[A-Z]/.test(trimmed) && !trimmed.includes(',') && !trimmed.includes('@')) {
    const words = trimmed.split(' ');
    if (words.length <= 5) return true;
  }

  return false;
}

interface TextSection {
  type: string | null;
  heading: string;
  lines: string[];
}

function splitIntoSections(rawText: string): TextSection[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const sections: TextSection[] = [];
  let currentSection: TextSection = { type: null, heading: '', lines: [] };
  let foundFirstSection = false;

  for (const line of lines) {
    if (isSectionHeading(line)) {
      const type = identifySectionType(line);
      if (type || foundFirstSection) {
        if (currentSection.lines.length > 0 || currentSection.heading) {
          sections.push(currentSection);
        }
        currentSection = { type, heading: line, lines: [] };
        foundFirstSection = true;
        continue;
      }
    }
    currentSection.lines.push(line);
  }

  if (currentSection.lines.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }

  return sections;
}

function parseContactSection(lines: string[]): ContactInfo {
  const allText = lines.join('\n');

  const name = lines[0] || '';
  const email = extractEmail(allText);
  const phone = extractPhone(allText.replace(email, ''));
  const linkedin = extractLinkedIn(allText);
  const github = extractGitHub(allText);
  const portfolio = extractPortfolio(allText);
  const location = extractLocation(allText.replace(email, '').replace(phone, ''));

  return { name, email, phone, location, linkedin, github, portfolio };
}

function parseExperienceSection(lines: string[]): WorkExperience[] {
  const experiences: WorkExperience[] = [];
  let current: Partial<WorkExperience> | null = null;
  let bulletBuffer: string[] = [];

  const saveCurrent = () => {
    if (current && current.company) {
      experiences.push({
        id: generateId(),
        company: current.company || '',
        title: current.title || '',
        location: current.location,
        startDate: current.startDate || '',
        endDate: current.endDate || 'Present',
        bullets: bulletBuffer,
      });
      bulletBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Date range detection
    const dateMatch = trimmed.match(
      /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–—to]+\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current)/i
    );

    if (dateMatch) {
      saveCurrent();
      current = {
        company: '',
        title: '',
        startDate: dateMatch[1],
        endDate: dateMatch[2],
      };
      // Get company/title from remaining text on the same line
      const rest = trimmed.replace(dateMatch[0], '').replace(/[|•|,]/g, ' ').trim();
      if (rest) current.title = rest;
      continue;
    }

    if (current) {
      if (!current.company && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
        if (!current.title) {
          current.title = trimmed;
        } else if (!current.company) {
          current.company = trimmed;
        } else {
          bulletBuffer.push(trimmed.replace(/^[•\-\*]\s*/, ''));
        }
      } else {
        bulletBuffer.push(trimmed.replace(/^[•\-\*]\s*/, ''));
      }
    } else {
      // No current job started yet, try to start one
      if (!trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
        current = { company: trimmed, title: '', startDate: '', endDate: 'Present' };
      }
    }
  }

  saveCurrent();
  return experiences;
}

function parseEducationSection(lines: string[]): Education[] {
  const educations: Education[] = [];
  let current: Partial<Education> | null = null;

  const save = () => {
    if (current && current.institution) {
      educations.push({
        id: generateId(),
        institution: current.institution || '',
        degree: current.degree || '',
        field: current.field,
        startDate: current.startDate,
        endDate: current.endDate || '',
        gpa: current.gpa,
        honors: current.honors,
      });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateMatch = trimmed.match(/(\d{4})\s*[-–]?\s*(\d{4}|present|current)?/i);
    const gpaMatch = trimmed.match(/gpa[:\s]+(\d+\.\d+)/i);

    if (gpaMatch && current) {
      current.gpa = gpaMatch[1];
      continue;
    }

    if (dateMatch) {
      save();
      current = {
        institution: '',
        degree: '',
        startDate: dateMatch[1],
        endDate: dateMatch[2] || dateMatch[1],
      };
      const rest = trimmed.replace(dateMatch[0], '').trim();
      if (rest) current.institution = rest;
      continue;
    }

    if (current) {
      if (!current.institution) current.institution = trimmed;
      else if (!current.degree) current.degree = trimmed;
      else if (!current.field) current.field = trimmed;
    } else {
      current = { institution: trimmed, degree: '', endDate: '' };
    }
  }

  save();
  return educations;
}

function parseSkillsSection(lines: string[]): string[] {
  const skills: string[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;|•\t]/);
    for (const part of parts) {
      const cleaned = part.replace(/^[-*•]\s*/, '').trim();
      if (cleaned && cleaned.length < 50 && cleaned.length > 1) {
        skills.push(cleaned);
      }
    }
  }
  return [...new Set(skills)];
}

export function parseRawTextToResume(rawText: string): ResumeData {
  const sections = splitIntoSections(rawText);

  let contact: ContactInfo = {
    name: '',
    email: '',
    phone: '',
    location: '',
  };
  let summary = '';
  let experience: WorkExperience[] = [];
  let education: Education[] = [];
  let skills: string[] = [];
  const certifications: string[] = [];
  const projects: string[] = [];

  // First section is usually contact info (even if not labeled)
  const firstSection = sections[0];
  if (firstSection && (!firstSection.type || firstSection.type === 'contact')) {
    contact = parseContactSection([firstSection.heading, ...firstSection.lines]);
  }

  for (const section of sections) {
    if (!section.type) continue;

    switch (section.type) {
      case 'contact':
        contact = parseContactSection([section.heading, ...section.lines]);
        break;
      case 'summary':
        summary = section.lines.join(' ');
        break;
      case 'experience':
        experience = parseExperienceSection(section.lines);
        break;
      case 'education':
        education = parseEducationSection(section.lines);
        break;
      case 'skills':
        skills = parseSkillsSection(section.lines);
        break;
    }
  }

  // If name wasn't found in contact section, use first line of file
  if (!contact.name) {
    const firstLine = rawText.split('\n').find(l => l.trim().length > 0);
    if (firstLine) contact.name = firstLine.trim();
  }

  return {
    contact,
    summary,
    experience,
    education,
    skills,
    certifications: [],
    projects: [],
    rawText,
  };
}
