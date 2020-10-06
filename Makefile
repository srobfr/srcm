help: ## Shows an help screen
	@echo "SRCM"
	@echo "Defined make targets :"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install dependancies
	npm i

build: ## Builds the distributable code
	-rm -rf dist
	./node_modules/.bin/tsc

publish-patch: install build test
	npm version patch
	git push origin "$(git rev-parse --abbrev-ref HEAD)" "$@" --tags
	npm publish

test: ## Runs tests
	./node_modules/.bin/mocha -r ts-node/register $(shell find src -name *.test.ts)
