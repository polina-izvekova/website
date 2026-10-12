# Public website

## 3rd party libraries

* [Font Awesome Free](https://fontawesome.com) by @fontawesome
* [GLightbox](https://github.com/biati-digital/glightbox) by Biati Digital
* [jQuery](https://jquery.com/) by OpenJS Foundation and other contributors
* [Pycs-Layout](https://github.com/ademonte/pycs-layout) by Antoine de Monte

## Updating the site

GitHub Pages serves the checked-in HTML, CSS, JavaScript and media directly.
There are no server-side includes, navigation scripts, or required deployment builds.

Every page contains its complete navigation and footer. Keep their links consistent
when editing the HTML. Shared design rules live in `css/site.css`, which is served
as written. Update its version query in each page when changing the stylesheet.

`src/style.css` is the input for the existing Tailwind utilities in `css/style.css`.
Run `npm run build` only when those utilities need to be regenerated, and include
the resulting CSS in the deployment. The Projects index is `projects/index.html`.
