## Before we begin

Hello! For people here who are new to GitHub, and are trying to submit a bug report or feature request, click the "Issues" tab at the top of this page, and then click "New Issue." You may need to create a GitHub account.

# Lighthouse

This is Lighthouse, a chat application similar to other popular ones, created by me, for fun. The code is as clean as I could manage to make it, albeit I wasn't focused on cleanliness the whole time, so certain things might be strange or difficult to decipher. If you want help making changes, or learning about the architecture, please feel free to ask me via email, at [charnam@lunarsphere.net](mailto:charnam@lunarsphere.net), or on Matrix, at `@charnam:lunarsphere.net`.

Lighthouse's latest release can be found online, at [lighthouse.lunarsphere.net](https://lighthouse.lunarsphere.net/).

- [Server and Dependency Setup](#starting-a-development-server)
- [Contributing](#contributing)
- [Licensing](#thanks-for-reading)

---

## Starting a Development Server

This server should theoretically work under Windows or WSL, but this has not (and will not) be tested by me.
To set up a development server, follow these steps:

1. [Install Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
	- It is recommended to use the latest LTS releases, but if for some reason that does not work, try Node's latest release instead.
	- As of writing this, the lowest required version of Node seems to be 18.x.
2. Enter the `server` directory, and run `./start.sh`. If you haven't configured everything yet, server setup will be handled automatically.
	- For development purposes, you may also run `./start.sh --quick`. This will skip package installs and unnecessary updates.

If you receive any errors at this point, please submit an issue. Otherwise, you're ready to start development! Check the contributing section below for guidelines on proper code etiquitte in this project.

---

## Contributing

If you'd like to contribute, great! Check the TODO file to see what's planned.

I also require that you set your editor to acknowledge these preferences:

- Tabs are tabs. This allows for anyone to choose how they view the code; If two-character wide indenting is preferred, you can change how tabulators are displayed in your editor, but please do not use spaces for indentation.
- Please do not auto-trim any of your whitespace. Trailing whitespace on non-blank lines should be removed, but on blank lines, please set your editor to keep it. This may not be common practice, but for this project, please make an exception. It makes adding code to certain sections much faster.

No AI, please. I will not accept pull requests that may compromise my project, or make it harder to read. It is up to you to write clean code, for others like me to understand.

### Documentation

The server makes use of multiple parts. Things that can be in another file generally should, unless multiple things inherently depend on each other and would have no reason to be separated.

- `index.js` : Main file, starts everything up.
	- Calls upon `Upload.js` for the file uploading API
	- Calls upon `StatedSession.js` for any user session
	- Handles webserver
	- Handles database (for now)
- `StatedSession.js` : A new `StatedSession` is created for every client connection, logged in or not.

More documentation should be added here later...

---

The client often makes use of a helper library I created, named `solar.js`, for UI elements. Since it is so unique, and ubiquitous in the client code, I figured I should give it its own section here.

Solar.JS itself is outdated, and desperately in need of a rewrite. If you'd like to do so, I'd be more than happy to accept a pull request. For now, I just don't really care to rewrite it myself, since it works as it should, and it doesn't seem like it's worth my time yet.

Code making use of it should be fairly readable, but in case you're confused, this is essentially how it works:

- `doc` is equivalent to `document.documentElement`
- `.el(<CSS selector>)` is equivalent to `querySelector` and `.els(<CSS selector>)` to `querySelectorAll`
- `.crel(<tag name>)` is equivalent to `createElement` and `appendChild` to the Element that it is invoked on (e.g `doc.crel("div")` creates a div directly in the `html` element)
- `.addc(<class name>)`: add class, `.remc`: remove class, `.sid`: set ID
- `.txt(<text>)` appends text to the inner content of an Element using `createTextNode`.
- `.prnt()` takes no arguments, and returns parentElement.

There is also `.anim`, which is a little more tricky to explain. You should be able to search for instances of it, and figure it out for yourself. `anim` is a powerful and useful command for animation.

Here is a sample of Solar.JS code for your convenience:

```js
let element = doc
	.crel("div")
		.addc("myDiv")
		.txt("This is awesome!")
	.prnt()
	.crel("div") // "element" will be a reference to this
		.addc("myOtherDiv")
		.txt("Oh, how I love mayonnaise.");

element.anim({
	// each key should have the same amount of array values; otherwise, strange behaviour can occur
	opacity: [0, 1],
	translateY: [20, 0],
	scale: [0, 1],
	blur: [10, 1],
	duration: 1000, // milliseconds
	easing: "ease-out" // CSS transition, supports cubic-bezier
});
```

---

## Thanks for reading!

That's mostly it. All code in this repository is licensed under the GNU Affero General Public License, version 3.0 or later. Have fun, and thanks for looking at my project!

