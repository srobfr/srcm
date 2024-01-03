## Sets up a NPM link for this working copy on the local system
link: node_modules
	npm link
	@echo '✅ Run "npm link srcm" in your project to use this working copy'

## Builds the distributable code
build: node_modules
	./node_modules/.bin/tsc

## Builds continuously the distributable code
watch: node_modules
	./node_modules/.bin/tsc -w

## Publish a new version on NPM, with PATCH semver level
publish-patch: build test
	npm version patch
	npm publish
	git push origin "$$(git rev-parse --abbrev-ref HEAD)"
	git push origin --tags

## Runs tests
test: node_modules
	./node_modules/.bin/mocha -r ts-node/register $(shell find src -name *.test.ts)

## node_modules dependancies
node_modules:
	npm i

## Help screen
COLOR_RESET   = \033[0m
COLOR_INFO    = \033[32m
COLOR_COMMENT = \033[33m
help:
	@printf "${COLOR_COMMENT}Usage:${COLOR_RESET}\n"
	@printf " make [target]\n\n"
	@printf "${COLOR_COMMENT}Available targets:${COLOR_RESET}\n"
	@awk '/^[a-zA-Z\-_0-9\.@]+:([a-zA-Z\-_0-9\.@ ]+)?$$/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
        helpCommand = substr($$1, 0, index($$1, ":")); \
        if (helpCommand != "help:" && helpCommand != ".PHONY:" && helpCommand != ".SILENT:") { \
            if (helpMessage) { \
                helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
                printf " \033[32m%-24s\033[0m %s\n", helpCommand, helpMessage; \
            } else { \
                printf " \033[32m%-24s\033[0m %s\n", helpCommand, ""; \
            } \
        } \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST) | sort -u -t ':' -k '1,1'
.DEFAULT_GOAL := help
