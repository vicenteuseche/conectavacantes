# APIs Oficiales para Plataformas de Empleo

## LinkedIn Jobs API
- **API Oficial**: LinkedIn Partner Program
- **URL**: https://developer.linkedin.com/
- **Endpoint**: `GET https://api.linkedin.com/v2/jobSearch`
- **Requisitos**: 
  - Registro en LinkedIn Developer Portal
  - Aprobación del producto "Jobs Search API"
  - OAuth 2.0 token con scope `r_liteprofile` y `r_emailaddress`
- **Límite**: 1000 requests/day

## Indeed API
- **API Oficial**: Indeed Publisher API
- **URL**: https://www.indeed.com/publisher/api/
- **Endpoint**: `GET https://api.indeed.com/v2/jobs`
- **Requisitos**:
  - Registro en Indeed Publisher
  - Publisher ID (no API key tradicional)
- **Límite**: 5000 requests/day
- **Nota**: Indeed está descontinuando su API pública, recomendado usar Indeed Apply

## Upwork API
- **API Oficial**: Upwork API
- **URL**: https://developers.upwork.com/
- **Endpoints**:
  - Jobs: `GET https://api.upwork.com/v3/profiles/v2/jobs/search`
  - Auth: OAuth 1.0a (requiere firma HMAC)
- **Requisitos**:
  - Registro como Upwork Developer
  - Client ID y Client Secret
  - OAuth 1.0a con firma de requests
- **Límite**: 5000 requests/hour

## Alternativas con APIs públicas

### LinkedIn (alternativa)
- **RapidAPI**: https://rapidapi.com/linkedin-api/
- **Costo**: ~$50/mes para 10,000 requests

### Indeed (alternativa)
- **JSearch API**: https://rapidapi.com/letscrape-6bRBa3Y1X8d/api/jsearch
- **Costo**: Gratis hasta 1000 requests/día

### Upwork (alternativa)
- **Upwork API** requiere aprobación manual
- **Freelancer.com API** disponible públicamente como alternativa

## Implementación recomendada
```python
# Para usar APIs oficiales, agregar a .env:
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token
INDEED_PUBLISHER_ID=your_indeed_publisher_id
UPWORK_KEY=your_upwork_key
UPWORK_SECRET=your_upwork_secret
UPWORK_PUBLIC_KEY=your_upwork_public_key
```

## Nota importante
Las APIs oficiales suelen requerir:
1. Proceso de aprobación manual
2. Cumplir con términos de uso estrictos
3. Mostrar datos actualizados en tiempo real
4. Atribución de marca requerida

**Recomendación**: Para producción inmediata, usar los fetchers actuales con User-Agent headers como workaround, y migrar a APIs oficiales cuando se obtenga acceso.