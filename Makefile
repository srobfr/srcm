SHELL:=/bin/bash -O globstar

help: ## Shows an help screen
	@echo "SRCM"
	@echo "Defined make targets :"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

test: ## Runs tests
	# Translating \ to \\ to easy copy/paste of failed tests using stableInspect() comparisons
	deno test src/ | sed 's:\\:\\\\:g'

fail-if-pending-changes:
	test "" = "$$(git status -suno)" || { git status -suno; echo "First commit your changes!"; false; }

npmDir?=npm
npm-build: ## Builds a npm version
	-rm -rf $(npmDir)
	mkdir -vp $(npmDir)
	cp -vr package.json tsconfig.json src $(npmDir)/
	rm -vf $(npmDir)/**/*.test.ts
	find $(npmDir) -type f -name '*.ts' | grep -vF node_modules | xargs sed -ri 's/\.ts";/";/g'
	cd $(npmDir) && npm i && ./node_modules/.bin/tsc

level ?= patch
origin ?= origin
version = $(shell jq -r .version deno.json)
patchVersion = $(shell deno run -A npm:semver -i $(level) $(version))

bump: fail-if-pending-changes test ## Tags & push a new version
	# Bumping patch $(version) => $(patchVersion)
	jq '.version = "$(patchVersion)"' deno.json | sponge deno.json
	jq '.version = "$(patchVersion)"' package.json | sponge package.json
	git add deno.json package.json
	git commit -m "$(patchVersion)" && git tag "v$(patchVersion)"
	git push $(origin) "v$(patchVersion)"

npm-publish: test npm-build
npm-publish: ## Builds and publish on npm
	cd $(npmDir) && npm publish

publish: bump npm-publish
publish: ## Bump, build, commit, push and publish on npm
