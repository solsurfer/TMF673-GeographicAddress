# TMF673 Geographic Address Management - ODA Component

ODA Component implementation of TMF673 Geographic Address Management API v4.0.1.

## Overview

This is a Helm-packaged ODA Component that provides standardized client interface to an Address management system for worldwide addresses. It implements the TM Forum TMF673 Geographic Address Management API specification.

### Features

- ✅ TMF673 Geographic Address Management API v4.0.1
- ✅ MongoDB integration for data persistence
- ✅ Health and readiness probes for Kubernetes
- ✅ Event notifications (Create, Update, Delete, StateChange)
- ✅ API Gateway integration with policy controls
- ✅ ODA Canvas compliant
- ✅ Swagger UI for API documentation and testing

### API Endpoints

- **Base Path**: `/tmf-api/geographicAddressManagement/v4/`
- **Swagger UI**: `/docs/`
- **Health Check**: `/health`
- **Readiness Check**: `/ready`

## Prerequisites

- Kubernetes cluster (v1.19+)
- Helm 3.x
- MongoDB running in `components` namespace (or update values.yaml)
- ODA Canvas installed (optional, for full ODA features)

## Quick Start

### 1. Build and Push Docker Image

First, build and push the Docker image to GitHub Container Registry:

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Build the image
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/geographicaddressapi:latest .

# Push to registry
docker push ghcr.io/YOUR_GITHUB_USERNAME/geographicaddressapi:latest
```

### 2. Update Configuration

Edit `values.yaml` and replace `YOUR_GITHUB_USERNAME` with your actual GitHub username:

```yaml
api:
  image: ghcr.io/YOUR_GITHUB_USERNAME/geographicaddressapi:latest
```

Also verify MongoDB configuration matches your environment:

```yaml
mongodb:
  host: mongodb-service.components.svc.cluster.local
  port: 27017
  database: tmf673
```

### 3. Install from GitHub

You can install directly from GitHub without cloning:

```bash
# Install from GitHub repository
helm install geoadd https://github.com/YOUR_GITHUB_USERNAME/TMF673-GeographicAddress/archive/main.tar.gz \
  -n components --create-namespace

# Or clone and install locally
git clone https://github.com/YOUR_GITHUB_USERNAME/TMF673-GeographicAddress.git
helm install geoadd ./TMF673-GeographicAddress -n components
```

### 4. Verify Installation

```bash
# Check deployment status
kubectl get pods -n components -l app.kubernetes.io/name=geographicaddress

# Check ODA Component (if ODA Canvas is installed)
kubectl get components -n components

# View logs
kubectl logs -n components -l impl=geoadd-geographicaddressapi
```

## Configuration

Key configuration values in `values.yaml`:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `api.image` | Docker image for the API | `ghcr.io/YOUR_GITHUB_USERNAME/geographicaddressapi:latest` |
| `api.replicas` | Number of API replicas | `1` |
| `api.resources.limits.cpu` | CPU limit | `500m` |
| `api.resources.limits.memory` | Memory limit | `512Mi` |
| `mongodb.host` | MongoDB hostname | `mongodb-service.components.svc.cluster.local` |
| `mongodb.port` | MongoDB port | `27017` |
| `mongodb.database` | Database name | `tmf673` |
| `component.functionalBlock` | ODA functional block | `CoreCommerce` |

## Testing the API

### From Within the Cluster

```bash
# Run a curl test pod
kubectl run curl-test --image=curlimages/curl -i --rm --restart=Never -n components -- \
  curl http://geoadd-geographicaddressapi:8080/health

# Test the API
kubectl run curl-test --image=curlimages/curl -i --rm --restart=Never -n components -- \
  curl http://geoadd-geographicaddressapi:8080/tmf-api/geographicAddressManagement/v4/geographicAddress
```

### Using Port Forward

```bash
# Forward the service port to localhost
kubectl port-forward -n components svc/geoadd-geographicaddressapi 8080:8080

# Then access in browser or curl
curl http://localhost:8080/health
curl http://localhost:8080/tmf-api/geographicAddressManagement/v4/geographicAddress
open http://localhost:8080/docs/
```

## MongoDB Configuration

### Using Existing MongoDB

If you have MongoDB already running in your cluster, update `values.yaml`:

```yaml
mongodb:
  host: your-mongodb-service.your-namespace.svc.cluster.local
  port: 27017
  database: tmf673
```

### With Authentication

If MongoDB requires authentication, uncomment and configure:

```yaml
mongodb:
  authSecret: mongodb-credentials
  authSecretUserKey: username
  authSecretPasswordKey: password
```

And create the secret:

```bash
kubectl create secret generic mongodb-credentials \
  --from-literal=username=your-user \
  --from-literal=password=your-password \
  -n components
```

## Upgrading

```bash
# Upgrade the release
helm upgrade geoadd ./TMF673-GeographicAddress -n components

# Or from GitHub
helm upgrade geoadd https://github.com/YOUR_GITHUB_USERNAME/TMF673-GeographicAddress/archive/main.tar.gz -n components
```

## Uninstalling

```bash
helm uninstall geoadd -n components
```

## ODA Component Details

### Component Metadata

- **ID**: TMFC029
- **Name**: geographicaddressmanagement
- **Functional Block**: CoreCommerce
- **Version**: 4.0.1
- **TMF API**: TMF673 Geographic Address Management

### Exposed APIs

- **TMF673**: Geographic Address Management API v4.0.0

### Published Events

- `GeographicAddressCreateEvent`
- `GeographicAddressAttributeValueChangeEvent`
- `GeographicAddressStateChangeEvent`
- `GeographicAddressDeleteEvent`

## Development

### Local Testing

```bash
# Build Docker image
docker build -t geographicaddressapi:test .

# Run with Docker Compose or Docker network
docker network create test-network
docker run -d --name mongodb --network test-network mongo:4.4
docker run -d --name geoadd --network test-network -p 8080:8080 \
  -e MONGODB_HOST=mongodb \
  -e MONGODB_PORT=27017 \
  -e MONGODB_DATABASE=tmf673 \
  geographicaddressapi:test
```

### Helm Chart Validation

```bash
# Lint the chart
helm lint .

# Test template rendering
helm template test-release . --debug

# Dry-run installation
helm install test-release . --dry-run --debug -n components
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod events
kubectl describe pod -n components -l impl=geoadd-geographicaddressapi

# Check logs
kubectl logs -n components -l impl=geoadd-geographicaddressapi
```

### MongoDB Connection Issues

Verify MongoDB is accessible:

```bash
kubectl run mongodb-test --image=mongo:4.4 -i --rm --restart=Never -n components -- \
  mongo --host mongodb-service.components.svc.cluster.local --eval "db.version()"
```

### Health Check Failures

```bash
# Test health endpoint directly
kubectl exec -n components deployment/geoadd-geographicaddressapi -- \
  curl -s http://localhost:8080/health
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         ODA Canvas / API Gateway            │
└────────────────┬────────────────────────────┘
                 │
                 │ /geoadd/tmf-api/...
                 │
┌────────────────▼────────────────────────────┐
│   Geographic Address API (TMF673)           │
│   - Swagger UI: /docs/                      │
│   - Health: /health, /ready                 │
│   - Port: 8080                              │
└────────────────┬────────────────────────────┘
                 │
                 │ MongoDB Connection
                 │
┌────────────────▼────────────────────────────┐
│   MongoDB (components namespace)            │
│   - Database: tmf673                        │
│   - Collections: GeographicAddress, etc.    │
└─────────────────────────────────────────────┘
```

## License

Unlicense

## References

- [TMF673 Specification](https://www.tmforum.org/resources/specification/tmf673-geographic-address-api-rest-specification-r19-5-0/)
- [ODA Component Accelerator](https://tmforum-oda.github.io/oda-ca-docs/)
- [TM Forum Open APIs](https://www.tmforum.org/oda/open-apis/)

## Support

For issues and questions, please open an issue in the GitHub repository.
