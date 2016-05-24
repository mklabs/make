all: foo foo2 foobar

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

