export default function handler(req, res) {
  const body = req.body || {};
  res.status(200).json({
    matchScore: 85,
    detectedLanguage: 'es',
    generatedText: `Propuesta generada para ${body.jobInput || 'la vacante seleccionada'} con enfoque en habilidades técnicas y presentación ATS.`,
    keywords: [{ keyword: 'React', matched: true }, { keyword: 'TypeScript', matched: true }],
    strengths: ['Experiencia técnica', 'Comunicación clara'],
    gaps: ['Contexto de producto', 'Escalabilidad']
  });
}
