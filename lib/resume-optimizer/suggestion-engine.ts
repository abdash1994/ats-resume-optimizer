import type { ATSScore, OptimizationSuggestion, ResumeData, JobContext } from '@/types/resume';

export function generateSuggestions(
  score: ATSScore,
  resume: ResumeData,
  jobContext: JobContext
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Missing required keywords (highest impact)
  for (const kw of score.missingKeywords.slice(0, 8)) {
    suggestions.push({
      id: `kw-missing-${kw}`,
      priority: 'critical',
      category: 'keyword',
      title: `Add missing keyword: "${kw}"`,
      description: `The job description requires "${kw}" but it's not found in your resume. Add it naturally to your summary, experience bullets, or skills section.`,
      autoFixable: resume.skills.length > 0,
      impact: 6,
    });
  }

  // Missing summary
  if (!resume.summary || resume.summary.length < 50) {
    suggestions.push({
      id: 'add-summary',
      priority: 'critical',
      category: 'section',
      title: 'Add Professional Summary',
      description: `A 2-4 sentence summary at the top of your resume that includes your top keywords is one of the highest-impact additions. ATS systems weight the summary heavily for keyword scanning.`,
      autoFixable: false,
      impact: 12,
    });
  }

  // Missing LinkedIn
  if (!resume.contact.linkedin) {
    suggestions.push({
      id: 'add-linkedin',
      priority: 'high',
      category: 'contact',
      title: 'Add LinkedIn Profile URL',
      description: 'Most ATS systems boost candidates with LinkedIn URLs. Add your full LinkedIn URL (linkedin.com/in/yourname) to your contact information.',
      autoFixable: false,
      impact: 5,
    });
  }

  // Missing location
  if (!resume.contact.location) {
    suggestions.push({
      id: 'add-location',
      priority: 'high',
      category: 'contact',
      title: 'Add City & Country/State',
      description: 'Location is a required field in most ATS systems. Add "City, State" or "City, Country" to your contact info.',
      autoFixable: false,
      impact: 4,
    });
  }

  // Low quantified bullets
  const bullets = resume.experience.flatMap(e => e.bullets);
  const quantifiedBullets = bullets.filter(b =>
    /\d+%|\$\d+|\d+[KMBx]|\d+ (million|billion|thousand)/i.test(b)
  );
  if (bullets.length > 0 && quantifiedBullets.length / bullets.length < 0.5) {
    suggestions.push({
      id: 'quantify-bullets',
      priority: 'high',
      category: 'achievement',
      title: 'Add numbers to your bullet points',
      description: `Only ${quantifiedBullets.length} of ${bullets.length} bullets have quantified results. ATS systems and recruiters heavily reward metrics. Add percentages, dollar amounts, user counts, or time savings to at least 50% of your bullets.`,
      autoFixable: false,
      impact: 10,
    });
  }

  // Missing skills section
  if (resume.skills.length === 0) {
    suggestions.push({
      id: 'add-skills',
      priority: 'critical',
      category: 'section',
      title: 'Add a Skills Section',
      description: 'A dedicated skills section is parsed by virtually every ATS. Add your top technical and professional skills matching the job description.',
      autoFixable: false,
      impact: 15,
    });
  } else if (resume.skills.length < 8) {
    suggestions.push({
      id: 'expand-skills',
      priority: 'high',
      category: 'keyword',
      title: `Expand skills section (currently ${resume.skills.length} skills)`,
      description: `Add more relevant skills from the job description. Aim for 12-20 targeted skills. Missing keywords can be added directly to skills.`,
      autoFixable: true,
      impact: 8,
    });
  }

  // Keyword density in summary
  if (resume.summary && score.missingKeywords.length > 0) {
    const topMissing = score.missingKeywords.slice(0, 3).join('", "');
    suggestions.push({
      id: 'summary-keywords',
      priority: 'high',
      category: 'keyword',
      title: 'Strengthen summary with key terms',
      description: `Your summary doesn't include key terms from the JD: "${topMissing}". Weave 3-5 top keywords into your summary naturally for maximum ATS impact.`,
      autoFixable: false,
      impact: 7,
    });
  }

  // Experience missing bullets
  const expWithoutBullets = resume.experience.filter(e => e.bullets.length === 0);
  if (expWithoutBullets.length > 0) {
    suggestions.push({
      id: 'add-bullets',
      priority: 'critical',
      category: 'achievement',
      title: `Add bullets to ${expWithoutBullets.length} experience entries`,
      description: `${expWithoutBullets.map(e => e.title + ' at ' + e.company).join(', ')} have no bullet points. Every role needs 3-5 achievement-focused bullets for ATS parsing.`,
      autoFixable: false,
      impact: 12,
    });
  }

  // Missing certifications if job requires them
  const jdLower = jobContext.jobDescription.toLowerCase();
  const certKeywords = ['certified', 'certification', 'certificate', 'license', 'pmp', 'aws certified', 'google certified'];
  const jdNeedsCerts = certKeywords.some(k => jdLower.includes(k));
  if (jdNeedsCerts && (!resume.certifications || resume.certifications.length === 0)) {
    suggestions.push({
      id: 'add-certs',
      priority: 'high',
      category: 'section',
      title: 'Add Certifications section',
      description: 'The job description mentions certifications. If you have relevant certifications, add a Certifications section. If not, consider pursuing the mentioned certification.',
      autoFixable: false,
      impact: 6,
    });
  }

  // ATS-hostile formatting warning
  suggestions.push({
    id: 'format-check',
    priority: 'medium',
    category: 'format',
    title: 'Verify ATS-safe formatting before uploading',
    description: 'When downloading, use the "ATS-Safe" PDF or DOCX option. Avoid tables, columns, text boxes, or graphics in the version you upload to ATS. Use the "Visual" version only for human review.',
    autoFixable: false,
    impact: 8,
  });

  // Sort by impact
  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.impact - a.impact;
  });
}
