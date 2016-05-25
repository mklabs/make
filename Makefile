all: foo foo2 foobar

# Tests

foo2:
	echo foo2

foo: prefoo prefoobar
	echo foo

prefoo:
	echo prefoo

foobar: prefoobar
	echo foobar

prefoobar:
	echo blahblah

test-init:
	cd test/examples && bake init --skip

# Useful stuff
babel:
	babel lib/ -d src/

watch:
	watchd lib/* test/* package.json -c 'bake test'

release: version push publish

version:
	standard-version -m '%s'

push:
	git push origin master --tags

publish:
	npm publish

test: babel
	bake test-init
	mocha -R spec

docs:
	mocha -R markdown >> readme.md
