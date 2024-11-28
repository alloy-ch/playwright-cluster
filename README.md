# Playwright Cluster

Current version: **v2.1.0**

![Build Status](https://github.com/alloy-ch/playwright-cluster/actions/workflows/build.yml/badge.svg)
![cov lines](./coverage/badge-lines.svg)
![cov functions](./coverage/badge-functions.svg)
![cov statements](./coverage/badge-statements.svg)
![cov branches](./coverage/badge-branches.svg)

[puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster) is a great library manages a
[puppeteer](https://github.com/puppeteer/puppeteer) cluster. This is re-implementation to make it work with 
[Playwright](https://github.com/microsoft/playwright), aiming at 100% API compatibility as a turn-key replacement.

## Install

`npm --save @alloy-ch/playwright-cluster`

## Usage

The documentation from puppeteer-cluster is still valid as the reference.

- [Usage](https://github.com/thomasdondorf/puppeteer-cluster#usage)
- [Examples](https://github.com/thomasdondorf/puppeteer-cluster#examples)
- [Concurrency implementations](https://github.com/thomasdondorf/puppeteer-cluster#concurrency-implementations)
- [Typings for input/output (via TypeScript Generics)](https://github.com/thomasdondorf/puppeteer-cluster#typings-for-inputoutput-via-typescript-generics)
- [Debugging](https://github.com/thomasdondorf/puppeteer-cluster#debugging)
- [API](https://github.com/thomasdondorf/puppeteer-cluster#api)

## Note

1. Firefox is hardcoded as the headless browser. This library does not work with Chromium or Webkit.
2. `BrowserContext` is not available in Puppeteer. Some options, e.g. `ignoreHTTPSErrors` cannot be directly translated from 
   `puppeteerOptions` to `playwrightOptions`. Therefore, we introduced `contextOptions` as an optional property in `ClusterOptions`.
