# Documentation templates

This directory contains templates for documentation files. These templates can be used as a starting
point for creating new documentation pages, ensuring consistency in formatting and structure across
the project.

Templates provide a predefined structure and formatting for different types of documentation,
but they are not meant to be rigidly followed in all cases. They are intended to serve as a helpful
starting point and to promote consistency, but the specific content and structure of each
documentation page should be tailored to the needs of that page and its intended audience. For
example, a guide that walks a user through a specific task may not need to include a "Known
Limitations" section, while a conceptual document that explains the architecture of the application
might benefit from such a section. The templates are meant to be flexible and adaptable to the needs
of each specific documentation page, while still promoting a consistent style and structure across
the project.

## Available templates

The following templates are available in this directory:

- Guide
  - This template should be used for tutorial/guide type content - i.e. docs that are intended to
    help someone to accomplish something specific. Example use cases might include:
    - First time setup
    - How to configure something in a particular way (e.g. to use different auth providers)

- Concept
  - This template should be used for conceptual content that explains how or why the application
    has been developed, configured, etc. Example use cases might include:
    - Explain architecture, roles, or known limitations.
    - Describe relevant either-or situations that someone might need to understand deeply before
      choosing between multiple options.
    - Give high-level context that might be relevant for a more specific task.

- Reference
  - This template should be used for reference-type content, like a fairly comprehensive document
    that someone might use to look up specific details on the application or how it works. Example
    use cases might include:
    - Available configuration variables and their possible values
    - API docs
    - CLI tool usage (parameters, etc)
