all: test

# Tests
test-init:
	cd test/examples && bake init --skip

# Useful stuff
babel:
	babel lib/ -d src/

watch:
	watchd lib/* test/* package.json -c 'bake test'

release: version push publish

version:
	standard-version

push:
	git push origin master --tags

publish:
	npm publish

test: babel
	bake test-init
	mocha -R spec

docs:
	mocha -R markdown >> readme.md
