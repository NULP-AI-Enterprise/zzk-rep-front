IMAGE   := ghcr.io/nulp-ai-enterprise/zzk-rep-front
NS      := zzk-front

.PHONY: help up down restart build pull logs shell ps clean \
        k8s-apply k8s-delete k8s-status k8s-logs k8s-restart seal-secret

help:          ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?##' Makefile | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-20s\033[0m %s\n",$$1,$$2}'

# ── Local Docker Compose ───────────────────────────────────────────────────────
up:            ## Start app (docker compose, detached)
	docker compose up -d --build

down:          ## Stop and remove containers
	docker compose down

restart:       ## Restart app container
	docker compose restart app

build:         ## Build image locally
	docker compose build app

pull:          ## Pull latest image from GHCR
	docker compose pull

logs:          ## Follow app logs  (pass s=app)
	docker compose logs -f $${s:-app}

shell:         ## Bash into running container
	docker compose exec app sh

ps:            ## Show container status
	docker compose ps

clean:         ## Remove containers AND volumes  ⚠️  destructive
	docker compose down -v

# ── Kubernetes ─────────────────────────────────────────────────────────────────
k8s-apply:     ## Apply all k8s manifests
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/sealed-secret.yaml
	kubectl apply -f k8s/deployment.yaml
	kubectl apply -f k8s/service.yaml
	kubectl apply -f k8s/ingress.yaml

k8s-delete:    ## Delete all k8s resources (keeps namespace)
	kubectl delete -f k8s/ingress.yaml    --ignore-not-found
	kubectl delete -f k8s/service.yaml    --ignore-not-found
	kubectl delete -f k8s/deployment.yaml --ignore-not-found

k8s-status:    ## Show pod/deployment status
	kubectl -n $(NS) get pods,deploy,svc,ingress

k8s-logs:      ## Stream pod logs
	kubectl -n $(NS) logs -l app=zzk-front -f --tail=100

k8s-restart:   ## Rolling restart of deployment
	kubectl -n $(NS) rollout restart deployment/zzk-front

seal-secret:   ## Seal k8s/secret.yaml → k8s/sealed-secret.yaml  (requires kubeseal)
	kubeseal --format yaml < k8s/secret.yaml > k8s/sealed-secret.yaml
	@echo "✓ sealed-secret.yaml updated — commit it, then delete k8s/secret.yaml"
