.PHONY: up down restart logs status validate

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose up -d --force-recreate

logs:
	docker compose logs -f web

status:
	docker compose ps

validate:
	node --check site/js/app.js
	node --check site/js/edu-game.js
	for f in site/lessons/*.js; do node --check "$$f"; done

