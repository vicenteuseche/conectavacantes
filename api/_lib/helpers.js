export const fallbackVacancies = (query = "desarrollador", regions = [], languages = [], contractTypes = []) => {
  const normalizedQuery = String(query || "desarrollador").toLowerCase();
  const regionList = regions?.length ? regions : ["latam", "na", "es", "caribe"];
  const languageList = languages?.length ? languages : ["es", "en"];
  const contractList = contractTypes?.length ? contractTypes : ["contrato", "proyecto"];
  const platformSeed = ["LinkedIn", "Indeed", "Workup", "Adzuna", "Arbeitnow"];

  return [
    {
      title: normalizedQuery.includes("react") ? "Senior React Developer" : normalizedQuery.includes("node") ? "Backend Node.js Engineer" : "Full Stack Developer Remote",
      company: "NovaTech Labs",
      location: regionList.includes("na") ? "Remote · USA" : regionList.includes("es") ? "Remote · Spain" : "Remote · LATAM",
      lang: languageList.includes("en") ? "en" : "es",
      matchScore: 88,
      description: `Vacante alineada con ${query || "tu perfil"} y con experiencia en desarrollo remoto.`,
      requirements: `React, TypeScript, APIs, trabajo remoto, ${contractList.join(", ")}`,
      platform: platformSeed[0],
      sourceApi: "fallback",
      recruiterEmail: "talent@novatechlabs.com"
    },
    {
      title: normalizedQuery.includes("python") ? "Python Software Engineer" : "Product Engineer",
      company: "Remote Atlas",
      location: regionList.includes("latam") ? "Remote · LATAM" : "Remote · Europe",
      lang: languageList.includes("es") ? "es" : "en",
      matchScore: 74,
      description: `Oportunidad de ${query || "desarrollo"} con enfoque en producto y escalabilidad.`,
      requirements: `Cloud, testing, colaboración, ${contractList.join(", ")}`,
      platform: platformSeed[1],
      sourceApi: "fallback",
      recruiterEmail: "jobs@remoteatlas.com"
    },
    {
      title: normalizedQuery.includes("data") ? "Data Engineer" : "Frontend Engineer",
      company: "BlueBridge",
      location: regionList.includes("caribe") ? "Remote · Caribe" : "Remote · Global",
      lang: languageList.includes("en") ? "en" : "es",
      matchScore: 66,
      description: `Vacante híbrida para perfiles con base técnica y experiencia en ${query || "tecnología"}.`,
      requirements: `UI/UX, APIs, CI/CD, ${contractList.join(", ")}`,
      platform: platformSeed[2],
      sourceApi: "fallback",
      recruiterEmail: "careers@bluebridge.io"
    }
  ];
};

export const json = (res, statusCode, body) => {
  res.status(statusCode).json(body);
};
