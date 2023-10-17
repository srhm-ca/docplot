<script>
  // import stores for files, embeddings
  import { files, setFiles } from "$lib/stores/Files";
  import { embeddings } from "$lib/stores/Embeddings";

  // import transformers
  import { env, AutoModel, AutoTokenizer } from "@xenova/transformers";
  env.allowRemoteModels = true; // allow downloads from huggingface.co

  // import components
  import Ranker from "$lib/components/Ranker.svelte";

  // import pdf.js
  const loadPdfJs = async () => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    return pdfjsLib;
  };

  // import mammoth
  const loadMammoth = async () => {
    const mammoth = await import("mammoth");
    return mammoth;
  };

  // initialize tokenizer and model
  let tokenizer;
  let model;

  // initialize query
  let query = "";
  let queryPrevious = "";
  let queryEmbedding = [];
  let calculationTimeout = null;

  // helper function to split a string into chunks
  // of given size, if the string size is greater than the given size
  function chunkString(str, size) {
    const strArray = str.split(" ");
    let chunks = [];
    for (let i = 0; i < strArray.length; i += size) {
      chunks.push(strArray.slice(i, i + size).join(" "));
    }
    return chunks;
  }

  // helper function that calculates average of the vectors
  function averageVectors(vectors) {
    let sum = vectors[0];
    for (let i = 1; i < vectors.length; i++) {
      sum = sum.map((value, index) => value + vectors[i][index]);
    }
    return sum.map((value) => value / vectors.length);
  }

  // reactive query
  $: if (query !== "" && query !== queryPrevious) {
    if (calculationTimeout) {
      clearTimeout(calculationTimeout);
    }
    calculationTimeout = setTimeout(async () => {
      const inputs = await tokenizer(query);
      const output = await model(inputs, { truncation: true, padding: true });
      queryEmbedding = output.last_hidden_state.data.slice(0, 384);
      queryPrevious = query;
    }, 500);
  }

  // function for processing embeddings
  async function processEmbeddings(file, text) {
    if (text) {
      // split the text into chunks of 512 tokens
      let chunks = chunkString(text, 512);
      let chunkEmbeddings = [];
      // for each chink, calculate the embeddings
      for (let chunk of chunks) {
        // print progress to log
        console.log(
          `Processing ${file.name}: ${chunks.indexOf(chunk) + 1}/${
            chunks.length
          }`
        );
        // tokenize chunks
        let inputs = await tokenizer(chunk, {
          truncation: true,
          padding: true,
        });
        // encode tokens
        let output = await model(inputs);
        // get embedding from final layer's CLS token
        chunkEmbeddings.push(output.last_hidden_state.data.slice(0, 384));
      }
      // calculate the average embeddings
      let avgVector = averageVectors(chunkEmbeddings);
      embeddings.update((arr) => [...arr, avgVector]);
    }
  }

  // function for processing dropped files
  async function processFile(file) {
    try {
      if (file.type.startsWith("text/")) {
        let reader = new FileReader();
        reader.onload = async function () {
          let text = reader.result;
          processEmbeddings(file, text);
        };
        reader.readAsText(file);
      } else if (file.type === "application/pdf") {
        const reader = new FileReader();

        reader.onload = async function (event) {
          const pdfData = event.target.result;

          try {
            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            const maxPages = pdf.numPages;
            let text = "";
            for (let i = 1; i <= maxPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              text += content.items.map((item) => item.str).join(" ");
            }
            processEmbeddings(file, text);
          } catch (error) {
            console.error("Error loading the PDF:", error);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type === "applications/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const reader = new FileReader();
        mammoth.extractRawText({ arrayBuffer: file }).then((result) => {
          const text = result.value;
          console.log(text);
          processEmbeddings(file, text);
        });
        reader.readAsArrayBuffer(file);
      } else {
        setFiles($files.filter((f) => f.name !== file.name));
        alert("Supported file types: text/DOCX/PDF.");
      }
    } catch (error) {
      console.error("An error occurred while processing the file:", error);
    }
  }

  // drop handler
  function dropHandler(event) {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);

    droppedFiles.forEach((file) => {
      if (!$files.some((existingFile) => existingFile.name === file.name)) {
        setFiles([...$files, file]);
        processFile(file);
      } else {
        alert(`File '${file.name}' is already in the list.`);
      }
    });
    document.getElementById("drop_zone").style.backgroundColor = "#fff";
  }

  // drag over handler, mainly for preventing the browser from opening the file
  function dragOverHandler(event) {
    event.preventDefault();
    document.getElementById("drop_zone").style.backgroundColor = "#eee";
    event.target.addEventListener("dragleave", () => {
      document.getElementById("drop_zone").style.backgroundColor = "#fff";
    });
  }

  function handleFileInputChange(event) {
    const selectedFiles = event.target.files;
    setFiles([...$files, ...Array.from(selectedFiles)]);
  }

  // delete file from file store
  function deleteFile(index) {
    const fileToDelete = $files[index];
    setFiles($files.filter((_, i) => i !== index));

    embeddings.update((arr) => {
      const updatedEmbeddings = [...arr];
      updatedEmbeddings.splice(index, 1);
      return updatedEmbeddings;
    });
  }

  // delete all files (unused for now)
  function deleteAllFiles() {
    setFiles([]);
    embeddings.set([]);
  }

  // intialize model and tokenizer
  //all-MiniLM-L6-v2 is a tiny model, but probably the best we can get in browser for now
  async function initialize() {
    try {
      tokenizer = await AutoTokenizer.from_pretrained(
        "Xenova/all-MiniLM-L6-v2"
      );
      model = await AutoModel.from_pretrained("Xenova/all-MiniLM-L6-v2");
      const pdfjsLib = await loadPdfJs();
      const mammoth = await loadMammoth();
    } catch (error) {
      console.error("Error initializing tokenizer and model:", error);
    }
  }

  // initialize page and close popup
  let isLoading = true;
  function closeLoadingPopup() {
    isLoading = false;
  }
  initialize().then(closeLoadingPopup);
</script>

<div id="app">
  {#if isLoading}
    <div id="loading-popup">
      <p>Loading model and tokenizer...</p>
    </div>
  {:else}
    <div style="display: flex; gap: 1ch; margin-bottom: -1em;"><h1>DocPlot</h1><p style="font-style: oblique; font-size: 90%; flex-grow: 1;">Semantic search in your browser, privately.</p><a style="font-size: 90%; align-self: center;" target="_blank" href="https://srhm.ca/">https://srhm.ca</a></div>
    <div id="content">
      <div id="left-gutter">
        <div id="file-list">
          {#if $files.length > 0}
            {#each $files as file, i (file.name)}
              <div id="file">
                <p
                  style="flex-grow: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"
                >
                  {file.name}
                </p>
                <button
                  style="width: fit-content;"
                  on:click={() => deleteFile(i)}>Delete</button
                >
              </div>
            {/each}
          {/if}
        </div>
        <div
          id="drop_zone"
          on:drop={dropHandler}
          on:dragover={dragOverHandler}
          role="button"
          tabindex="0"
        >
          <p>Drag text/.docx/.pdf files here.</p>
        </div>
      </div>
      <div id="right-gutter">
        <Ranker {queryEmbedding} />
        <input style="font-size: 100%;" id="query-input" placeholder="Search here..." bind:value={query} />
      </div>
    </div>
  {/if}
</div>

<style>
  :root {
    font-family: sans-serif;
    padding: 1em;
    background: #efefef;
    overflow: hidden;
    height: 100vh;
  }

  h1 {
    margin: 0;
  }
  #drop_zone {
    padding-top: 0.5em;
    border: 1px solid #ccc;
    padding: 25px;
    text-align: center;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
    min-width: fit-content;
    color: #555;
    max-height: 4em;
    flex-shrink: 1;
  }

  #file-list {
    border: 1px solid #ccc;
    font-size: 90%;
    flex-grow: 1;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
    overflow-y: auto;
    height: 100%;
  }

  #file {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5em;
    border-bottom: 1px solid #ccc;
    background: #fff;
  }

  #file:hover {
    background: #efefef;
  }

  #query-input {
    padding: 0.5em;
    border: 1px solid #ccc;
  }

  #app {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  #content {
    padding-top: 1em;
    height: 100%;
    display: flex;
    flex-direction: row;
    gap: 1em;
  }

  #left-gutter {
    display: flex;
    flex-direction: column;
    width: 30%;
    height: 100%;
    gap: 1em;
    max-width: 35ch;
  }

  #right-gutter {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  #loading-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 1em;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  }
</style>
