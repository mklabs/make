
## Bake

Bake is a little experiment to implement a simple task runner similar to
Make in JavaScript, while bringing in the conveniency of npm scripts by
automatically adding `./node_modules/.bin` directory to the `$PATH`.

It takes a similar approach to Make with a very close syntax. Of course,
GNU Make is huge and Bake won't ever be on par with it, nor does it aim
to do so. The parser used by Bake is under 100 sloc.

For now, basic variable and target declarations are supported, along
with basic prerequities support (eg. task depending on other tasks).

### Example


    somevar = anything after "=" is considered the value till the end of the line

    OUT_FLAGS = output.js


    build: build-js build-css
      echo Build done

    build-js: a.js b.js
      cat a.min.js b.min.js > $OUT_FLAGS
      echo JS file built

    build-css:
      cat a.css b.css > style.css
      echo CSS built

    a.js:
      echo "Minify a.js"
      uglifyjs a.js -o a.min.js

    b.js:
      echo "Minify b.js"
      uglifyjs b.js -o b.min.js

    all: build

### Advantages over Make

- No hard tab requirement
- Implemented in JavaScript only, so works wherever node works
- No need to prefix rules with `$@` for silent output
- Slightly easier variables substitution (eg. `$VARIABLE` instead of `$(VARIABLE)`

### TODO

- Variable substitution for prerequities and targets (right now, replacement is done only for rules / recipes)

- Implement [pattern rules](https://www.gnu.org/software/make/manual/html_node/Pattern-Intro.html#Pattern-Intro)

- Implement [automatic variables](https://www.gnu.org/software/make/manual/html_node/Automatic-Variables.html#Automatic-Variables)

- Implement mtime check (a target needs to be rebuilt if it does not exist of if it's older than any of the prerequisites)


