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

# Useful stuff
babel:
	babel lib/ -d src/

watch:
	watchd lib/* -c 'npm run babel'

release: version push publish

version:
	standard-version -m '%s'

push:
	git push origin master --tags

publish:
	npm publish

test: babel
	bake
