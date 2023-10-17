# DocPlot
DocPlot lets you rank documents by how closely they match arbitrary search queries. You can drag and drop in text files or PDFs from your computer and the web app will encode them with a small language model running on your device. Note: works best with English documents.

DocPlot is written in `Svelte` and `transformers.js`.

## To Do
- [ ] run tokenizer/model in service worker to prevent UI blocking
- [ ] support PDF, .docx, etc.
- [ ] per-chunk distance vs. averaged CLS distance
- [ ] model selector

## Example
![9c242444926edbf0d20329e52ba5db000ba5e255c5ac536ab42697a14806d49a](https://github.com/srhm-ca/docplot/assets/49847930/47403bc6-5f66-40ab-8464-ff4eb7d25314)
