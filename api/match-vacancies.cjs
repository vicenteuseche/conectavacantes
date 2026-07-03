const { fallbackVacancies, json } = require('./_lib/helpers.cjs');

module.exports = (req, res) => {
  const body = req.body || {};
  const vacancies = fallbackVacancies(body.searchQuery, body.allowedRegions, body.languages, body.contractTypes);
  json(res, 200, { vacancies });
};
