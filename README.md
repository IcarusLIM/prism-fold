# Prismjs fold json

A plugin for Prismjs add folding to JSON map and list [Demo](https://unpkg.com/prismjs-fold-json@1.0.8/test.html)  
This algorithm should work for any C-like language. `JSON/JavaScript/Java` is accepted by defualt, you can set environment variable PRISM_FOLD_HOOK_LANGUAGES to add more

## How It Work

This plugin parse tokens from Prism and wraps {} & [] pairs in a `<details>` tag to provide code folding

It add "after-tokenize" and "wrap" handlers to Prism hooks  
- after-tokenize handler: identifies token with `type=="punctuation"` and `content=="{" || content=="["`, turns flatten token list to nested tokens corresponding to folding  
- wrap handler: set details/summery tags before final stringify  

### Differences from others

Inspire by [prism-js-fold](https://www.npmjs.com/package/prism-js-fold?activeTab=readme), by using semantic HTML tag `<details>` no JavaScript events was attached  
It hooks "after-tokenize" and "wrap" which called by Prism.highlight a Low-level function, therefore we can make better use of tokens split by prism itself instead of lots of regex matching. Besides, folding for direct call to Prism.highlight also works transparently

## Setup

### Use with Node

Install from npm

```bash
npm install prismjs-fold-json
```

Require or import it after Prism

```js
const Prism = require('prismjs')
require('prismjs-fold-json')

// Returns a highlighted HTML string
const html = Prism.highlight(JSON.stringify({ a: [1, 2] }, null, 4), Prism.languages.json, "json")
```

**note**: Add css import in main.js/main.ts if use in vue or react
```js
import 'prismjs-fold-json/main.css'
```

### Use with CDN

```html
<!doctype html>
<html lang="en-US">

<head>
    <link rel="stylesheet" href="https://unpkg.com/prismjs@1.29.0/themes/prism-coy.min.css" />
    <!-- import css file -->
    <link rel="stylesheet" href="https://unpkg.com/prismjs-fold-json@1.x.x/main.css" />
</head>

<body>
    <script src="https://unpkg.com/prismjs@1.29.0/components/prism-core.min.js"></script>
    <script src="https://unpkg.com/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <!-- import js file (after prismjs)  -->
    <script src="https://unpkg.com/prismjs-fold-json@1.x.x/index.js"></script>
</body>

</html>
```

## Known Issue

The `details` tag behaves differently in different browsers:
- in chromium>=128: new line created 
- others: extra spaces added to every children lines

This repository should be compatible with these behaviors [code](https://github.com/IcarusLIM/prism-fold/blob/main/index.js#L128-L160). If not, try to set environment variable PRISM_IN_CHROME_LIKE (auto/new/old/none)