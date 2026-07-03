import { fallbackVacancies, json } from './_lib/helpers.js';

export default function handler(req, res) {
  const body = req.body || {};
  const vacancies = fallbackVacancies(body.searchQuery, body.allowedRegions, body.languages, body.contractTypes);
  json(res, 200, { vacancies });
}
