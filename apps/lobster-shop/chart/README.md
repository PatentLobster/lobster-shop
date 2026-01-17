# Lobster Shop Helm Chart

Enterprise-grade Kubernetes deployment for the Lobster Shop microservices application.

## Overview

This umbrella chart deploys the complete Lobster Shop application stack:
- **Frontend**: React SPA served via Nginx
- **Public API**: NestJS REST API + Kafka Producer
- **Private API**: NestJS Kafka Consumer + MongoDB Client

## Prerequisites

- Kubernetes 1.24+
- Helm 3.8+
- Kafka cluster (Strimzi recommended)
- MongoDB (MongoDB Operator recommended)
- Optional: KEDA 2.10+ for event-driven autoscaling
- Optional: Prometheus Operator for monitoring

## Quick Start

### 1. Install with Default Configuration

```bash
helm install lobster-shop ./apps/lobster-shop/chart
```

### 2. Install with Custom Image Tag

```bash
helm install lobster-shop ./apps/lobster-shop/chart \
  --set global.imageTag=v1.0.0
```

### 3. Install with Ingress Enabled

```bash
helm install lobster-shop ./apps/lobster-shop/chart \
  --set ingress.enabled=true \
  --set ingress.domain=lobster-shop.example.com
```

### 4. Install with KEDA Enabled

```bash
helm install lobster-shop ./apps/lobster-shop/chart \
  --set global.imageTag=v1.0.0 \
  --set privateApi.keda.enabled=true \
  --set privateApi.keda.lagThreshold=50
```

## Configuration

### Global Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.imageRegistry` | Image registry for all services | `ghcr.io` |
| `global.imageTag` | Image tag for all services | `Chart.appVersion` |
| `global.imagePullPolicy` | Image pull policy | `IfNotPresent` |
| `global.imagePullSecrets` | Image pull secrets | `[]` |

### Infrastructure Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `infrastructure.kafka.bootstrapServers` | Kafka bootstrap servers | `kafka-cluster-kafka-bootstrap:9092` |
| `infrastructure.kafka.topic` | Kafka topic for purchases | `purchases` |
| `infrastructure.mongodb.uri` | MongoDB connection URI | `mongodb://mongodb-svc:27017` |
| `infrastructure.mongodb.database` | MongoDB database name | `lobster-shop` |

### Frontend Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.enabled` | Enable frontend deployment | `true` |
| `frontend.replicaCount` | Number of replicas | `2` |
| `frontend.autoscaling.enabled` | Enable HPA | `true` |
| `frontend.autoscaling.minReplicas` | Minimum replicas | `2` |
| `frontend.autoscaling.maxReplicas` | Maximum replicas | `10` |

### Public API Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `publicApi.enabled` | Enable public-api deployment | `true` |
| `publicApi.replicaCount` | Number of replicas | `2` |
| `publicApi.config.kafkaBrokers` | Kafka brokers | `kafka-cluster-kafka-bootstrap:9092` |
| `publicApi.config.privateApiUrl` | Private API URL | `http://lobster-shop-privateApi:80` |

### Private API Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `privateApi.enabled` | Enable private-api deployment | `true` |
| `privateApi.replicaCount` | Number of replicas | `2` |
| `privateApi.keda.enabled` | Enable KEDA autoscaling | `false` |
| `privateApi.keda.lagThreshold` | Kafka lag threshold for scaling | `10` |
| `privateApi.keda.maxReplicaCount` | Maximum replicas with KEDA | `20` |

### Monitoring Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `monitoring.enabled` | Enable Prometheus monitoring | `true` |
| `monitoring.serviceMonitor.enabled` | Create ServiceMonitors | `true` |

### Security Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `security.networkPolicy.enabled` | Enable NetworkPolicies | `true` |
| `security.podSecurityStandards.enforce` | Pod Security Standard | `restricted` |

## Common Operations

### Upgrade Deployment

```bash
helm upgrade lobster-shop ./apps/lobster-shop/chart \
  --set global.imageTag=v1.1.0
```

### Enable KEDA After Installation

```bash
helm upgrade lobster-shop ./apps/lobster-shop/chart \
  --reuse-values \
  --set privateApi.keda.enabled=true
```

### Scale a Service

```bash
# Disable autoscaling first
helm upgrade lobster-shop ./apps/lobster-shop/chart \
  --reuse-values \
  --set publicApi.autoscaling.enabled=false \
  --set publicApi.replicaCount=5
```

### Uninstall

```bash
helm uninstall lobster-shop
```

## Architecture

```
┌─────────────┐    HTTP     ┌──────────────┐    Kafka      ┌──────────────┐
│   Frontend  │────────────>│  Public API  │──────────────>│      Kafka    │
│  (React)    │             │  (Producer)  │               │   (Strimzi)   │
└─────────────┘             └──────────────┘               └───────┬───────┘
                                                                    │
       ┌────────────────────────────────────────────────────────────┘
       │ Consume (KEDA scales based on lag)
       ▼
┌──────────────┐          ┌──────────────┐
│  Private API │─────────>│   MongoDB    │
│  (Consumer)  │  Persist │   Operator   │
└──────────────┘          └──────────────┘
```

## Features

### Enterprise-Grade Security
- Non-root containers with dropped capabilities
- Read-only root filesystem
- Pod Security Standards enforcement
- NetworkPolicies for zero-trust networking
- Secret management ready

### High Availability
- Pod Disruption Budgets
- Pod anti-affinity rules
- Multiple replicas by default
- Health checks (liveness/readiness)

### Observability
- Prometheus ServiceMonitors
- Metrics endpoints on all services
- Structured logging
- Health check endpoints

### Scalability
- HorizontalPodAutoscaler for Frontend and Public API
- KEDA autoscaling for Private API (Kafka lag-based)
- Configurable resource limits
- StatefulSets avoided (all services are stateless)

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -l app.kubernetes.io/instance=lobster-shop
```

### View Logs
```bash
kubectl logs -l app.kubernetes.io/name=private-api --tail=100 -f
```

### Debug NetworkPolicy
```bash
# Temporarily disable NetworkPolicies
helm upgrade lobster-shop . --reuse-values --set security.networkPolicy.enabled=false
```

### Check KEDA Scaling
```bash
kubectl get scaledobject
kubectl describe scaledobject lobster-shop-privateApi
```

## Contributing

Issues and pull requests are welcome at: https://github.com/patentlobster/lobster-shop

## License

MIT
