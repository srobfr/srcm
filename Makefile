help: ## Shows an help screen
	@echo "SRCM"
	@echo "Defined make targets :"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install dependancies
	npm i

build: install ## Builds the distributable code
	-rm -rf dist
	./node_modules/.bin/tsc

watch: install ## Builds continuously the distributable code
	./node_modules/.bin/tsc -w

publish-patch: build test ## Publish a new version on NPM, with PATCH semver level
	npm version patch
	npm publish
	git push origin "$$(git rev-parse --abbrev-ref HEAD)"
	git push origin --tags

test: ## Runs tests
	./node_modules/.bin/mocha -r ts-node/register $(shell find src -name *.test.ts)
