SHELL:=/bin/bash -O globstar

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
	cp -vr package.json tsconfig.json src $(npmDir)/
	rm -vf $(npmDir)/**/*.test.ts
	find $(npmDir) -type f -name '*.ts' | grep -vF node_modules | xargs sed -ri 's/\.ts";/";/g'
	cd $(npmDir) && npm i && ./node_modules/.bin/tsc

npm-publish: test npm-build
npm-publish: ## Builds and publish on npm
	cd $(npmDir) && npm publish


bump-patch: test ## Tags & push a new patch version
	deno run -A https://deno.land/x/version/index.ts patch
	npm publish
	git push origin "$$(git rev-parse --abbrev-ref HEAD)"
	git push origin --tags
