# Fressen

> A restaurant review mobile-ready web application with seamless offline experience.

## Getting started

A quick introduction of the minimal setup you need to get up running this project.

```shell
git clone https://github.com/volcain-io/fressen.github
cd fressen/
```

### What do I do from here?

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. With your server running, visit the site: `http://localhost:8000`.

## Developing

### Built With

[HTML5](https://www.w3.org/TR/html5/)
[CSS3](https://www.w3.org/Style/CSS/)
[JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

### Prerequisites

In order to display 'index.html' you have to start a simple HTTP server.

### Setting up Dev

Clone the repository:

```shell
git clone https://github.com/volcain-io/fressen.github
cd fressen/
npm install
```

Place all images inside the `img` folder. To create responsive images
```shell
cd fressen/
./node_modules/grunt/bin/grunt
```

Grunt than creates a new, completed images directory called `images` with responsive images. 

Happy coding!

## Validation

The HTML and CSS Code is validated against the [W3C's Validators](http://validator.w3.org/).

## Style guide

The code style relies on [Prettier](https://prettier.io).

## Licensing

[MIT License](LICENSE)



