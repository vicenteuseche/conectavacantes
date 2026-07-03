# Esquema recomendado de Firestore

## Colecciones

### users
- userId: string
- email: string
- displayName: string
- createdAt: string
- updatedAt: string

### profiles
- userId: string
- email: string
- displayName: string
- keywords: string
- linkedinProfile: string
- updatedAt: string

### processes
- processId: string
- userId: string
- userEmail: string
- title: string
- company: string
- platform: string
- matchScore: number
- status: string
- recruiterEmail: string
- date: string
- createdAt: string

### metrics
- metricId: string
- userId: string
- userEmail: string
- type: string
- platform: string
- matchScore: number
- company: string
- createdAt: string

### searchEvents
- eventId: string
- userId: string
- userEmail: string
- query: string
- resultsCount: number
- filters: object
- createdAt: string
