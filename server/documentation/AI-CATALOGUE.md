# AI Integration Catalogue

## Scope

The backend exposes contracts, not AI implementation. Access is restricted to `DISASTER_MANAGER` and `SYSTEM_ADMIN`. If no provider is injected, calls fail with `501 INTEGRATION_PROVIDER_NOT_CONFIGURED`.

## Risk Assessment

### Endpoint
`POST /api/v1/integrations/ai/risk-assessment`

### Purpose
Forward trip/location context to an external model for optional risk scoring beyond deterministic backend rules.

### Validated input

```json
{
  "tripId": "UUID",
  "location": {
    "latitude": 27.7,
    "longitude": 85.3
  },
  "context": {}
}
```

### Connect to
- trip risk classifier
- contextual danger scoring service
- environmental risk model
- route/location risk model

### Suggested provider output

```json
{
  "riskScore": 0.82,
  "riskLevel": "HIGH",
  "reasons": ["example factor"],
  "modelVersion": "risk-model-v1"
}
```

The backend currently forwards provider output rather than enforcing this response schema.

## Hazard Analysis

### Endpoint
`POST /api/v1/integrations/ai/hazard-analysis`

### Validated input

```json
{
  "hazardId": "optional UUID",
  "type": "LANDSLIDE",
  "description": "Rockfall near the route",
  "location": {
    "latitude": 27.7,
    "longitude": 85.3
  },
  "context": {}
}
```

### Connect to
- hazard classifier
- severity estimator
- hazard prioritization model
- a multimodal pipeline after another component extracts evidence features

### Suggested provider output

```json
{
  "classification": "LANDSLIDE",
  "severity": "HIGH",
  "confidence": 0.91,
  "modelVersion": "hazard-model-v1"
}
```

## Capability discovery

`GET /api/v1/integrations/capabilities`

## Backend responsibility
- authentication and authorization
- request validation
- provider interface
- stable endpoint
- safe failure when no provider exists

## AI-team responsibility
- model training
- inference hosting
- preprocessing beyond the agreed contract
- model versioning
- confidence/calibration
- stable provider response

Use the minimum personal/location data required for the model.
