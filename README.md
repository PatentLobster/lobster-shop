# 🦞 Lobster Shop

A **Kubernetes-native** microservices application demonstrating cloud-native best practices.

## 🏗️ Architecture

```
┌─────────────┐    HTTP     ┌──────────────┐    Kafka      ┌───────────────┐
│   Frontend  │────────────>│  public-api  │──────────────>│      Kafka    │
│  (React)    │             │  (Producer)  │               │   (KRaft)     │
└─────────────┘             └──────────────┘               └───────┬───────┘
                                                                   │
       ┌───────────────────────────────────────────────────────────┘
       │ Consume
       ▼
┌──────────────┐          ┌──────────────┐
│  private-api │─────────>│   MongoDB    │
│  (Consumer)  │  Persist │              │
└──────────────┘          └──────────────┘
```

## 🚀 Quick Start

### Run Locally


```bash
# Copy environment template
cp .env.example .env

# Build and start all services
docker-compose up --build

# Access the app
open http://localhost:8080
```

### 📦 Services

- **Frontend**: http://localhost:8080
- **public-api**: http://localhost:3000/api
- **private-api**: http://localhost:3100/api

## Deploy to Kubernetes

## Requirements:
  - Kubernetes cluster with:
    - https://github.com/prometheus-operator/prometheus-operator (for ServiceMonitors)
    - https://keda.sh (for event-driven autoscaling)
    - Ingress controller (optional, for external access)

1. Create Namespace

  ```bash
  kubectl create ns lobster-shop
  ```

2. Install Infrastructure (Kafka + MongoDB) - Optional

  #### Install Kafka (Bitnami)
```bash
  helm install my-kafka oci://registry-1.docker.io/bitnamicharts/kafka \
    -n lobster-shop \
    --set global.security.allowInsecureImages=true \
    --set persistence.enabled=false \
    --set replicas=3 \
    --set controller.replicaCount=3 \
    --set resourcesPreset=micro \
    --set controller.resourcesPreset=micro \
    --set defaultInitContainers.prepareConfig.resourcesPreset=micro \
    --set image.repository=bitnamilegacy/kafka
```
  #### Install MongoDB (Bitnami)
```bash
  helm install my-mongodb oci://registry-1.docker.io/bitnamicharts/mongodb \
    -n lobster-shop \
    --set auth.enabled=false \
    --set persistence.enabled=false \
    --set resourcesPreset=micro
```
3. Install Lobster Shop Application

```bash
  helm install lobster-shop oci://ghcr.io/patentlobster/lobster-shop/lobster-shop \
    -n lobster-shop \
    -f values.yaml
```


#### Example values.yaml:

```yaml
  public-api:
    config:
      kafkaBrokers: "my-kafka.lobster-shop.svc.cluster.local:9092"
      privateApiUrl: "http://lobster-shop-private-api.lobster-shop.svc.cluster.local:80"
    secrets:
      kafkaSasl:
        enabled: true
        mechanism: "PLAIN"
        existingSecret: "my-kafka-user-passwords"
        username: "user1"
        passwordKey: "client-passwords"

  private-api:
    ingress:
      enabled: true
      className: "nginx"
      annotations:
        cert-manager.io/cluster-issuer: "letsencrypt-prod"
      hosts:
        - host: lobster-shop-public-api.example.com
          paths:
            - path: /
              pathType: Prefix
    config:
      kafkaBrokers: "my-kafka.lobster-shop.svc.cluster.local:9092"
      kafkaGroupId: "purchase-processor-group"
      mongodbUri: "mongodb://my-mongodb.lobster-shop.svc.cluster.local:27017"
      mongodbDatabase: "lobster-shop"
    secrets:
      kafkaSasl:
        enabled: true
        mechanism: "PLAIN"
        existingSecret: "my-kafka-user-passwords"
        username: "user1"
        passwordKey: "client-passwords"
    keda:
      enabled: true  # Enable Kafka lag-based autoscaling

  frontend:
    config:
      apiUrl: "https://lobster-shop-public-api.example.com"
    # Optional: Enable ingress for external access
    ingress:
      enabled: true
      className: "nginx"
      annotations:
        cert-manager.io/cluster-issuer: "letsencrypt-prod"
      hosts:
        - host: lobster-shop.example.com
          paths:
            - path: /
              pathType: Prefix
      tls:
        - secretName: lobster-shop-tls
          hosts:
            - lobster-shop.example.com
```
