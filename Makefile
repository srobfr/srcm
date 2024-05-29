help: ## Shows an help screen
	@echo "SRCM"
	@echo "Defined make targets :"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

test: ## Runs tests
  # Translating \ to \\ to easy copy/paste of failed tests using stableInspect() comparisons
	deno test src/ | sed 's:\\:\\\\:g'

npmDir?=npm
npm-build: ## Builds a npm version
	-rm -rf $(npmDir)
	mkdir -vp $(npmDir)
	cp -v package.json $(npmDir)/

publish-patch: build test ## Publish a new version on NPM, with PATCH semver level
	npm version patch
	npm publish
	git push origin "$$(git rev-parse --abbrev-ref HEAD)"
	git push origin --tags
