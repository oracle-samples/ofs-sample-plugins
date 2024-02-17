# Templates:

The templates are based on the [`cookiecutter`](https://github.com/cookiecutter/cookiecutter) tool. You can use them to create a new plugin with the following command:

```cookiecutter <template_path>``` or
```cookiecutter <template_git_url> --directory <template_name>```

Where:
- `<template_path>` is the path to the template folder
- `<template_git_url>` is the git url to the template repository
- `<template_name>` is the name of the template folder

Example:

```cookiecutter https://github.com/oracle-samples/ofs-sample-plugins --directory="templates/basic"``` will create a new plugin using the `basic` template.

The following templates are available:

- `basic`: A basic plugin with the minimum required files. Uses a simple bootstrap presentation layer. Uses the packages `@ofs-users/plugin` and `@ofs-users/core`.
- `ojet-beta`: A plugin with a more complex presentation layer. Uses Oracle JET with Virtual DOM as the presentation layer. Currently in beta mode. Self-contained. See {this} (https://docs.oracle.com/en/middleware/developer-tools/jet/15.1/index.html) for a full guide on Oracle JET.