# DocPlot
DocPlot lets you rank documents by how closely they match arbitrary search queries. You can drag and drop in text files or PDFs from your computer and the web app will encode them with a small language model running on your device. Note: works best with English documents.

DocPlot is written in `Svelte` and `transformers.js`.

## To Do
- [ ] run tokenizer/model in service worker to prevent UI blocking
- [ ] support PDF, .docx, etc.
- [ ] per-chunk distance vs. averaged CLS distance
- [ ] model selector

## Example
![Screenshot 2023-10-17 at 15 04 11](https://github.com/srhm-ca/docplot/assets/49847930/35d26084-c57f-46d6-aa1a-11e006556c99)
