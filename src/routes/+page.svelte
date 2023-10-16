<script>
  import { files, setFiles } from "$lib/stores/Files";
  import { embeddings } from "$lib/stores/Embeddings";
  import { env, AutoModel, AutoTokenizer } from "@xenova/transformers";
  import Ranker from "$lib/components/Ranker.svelte";

  let tokenizer;
  let model;

  let query = "";
  let queryPrevious = "";
  let queryEmbedding = [];
  let calculationTimeout = null;

  env.allowRemoteModels = true;

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


  async function initialize() {
    try {
      tokenizer = await AutoTokenizer.from_pretrained(
        "Xenova/all-MiniLM-L6-v2"
      );
      model = await AutoModel.from_pretrained("Xenova/all-MiniLM-L6-v2");
    } catch (error) {
      console.error("Error initializing tokenizer and model:", error);
    }
  }

  async function processEmbeddings(file) {
    try {
      if (isPlainText(file)) {
        let reader = new FileReader();
        reader.onload = async function () {
          let text = reader.result;
          let inputs = await tokenizer(text, {
            truncation: true,
            padding: true,
          });
          let output = await model(inputs);
          let vector = output.last_hidden_state.data.slice(0, 384);
          embeddings.update((arr) => [...arr, vector]);
        };

        reader.readAsText(file);
      } else {
        setFiles($files.filter((f) => f.name !== file.name));
        alert("Only plain text files are allowed.");
      }
    } catch (error) {
      console.error("An error occurred while processing the file:", error);
    }
  }

  function isPlainText(file) {
    if (file.type === "text/plain") {
      return true;
    }
  }

  function dropHandler(event) {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);

    droppedFiles.forEach((file) => {
      if (!$files.some((existingFile) => existingFile.name === file.name)) {
        setFiles([...$files, file]);
        processEmbeddings(file);
      } else {
        alert(`File '${file.name}' is already in the list.`);
      }
    });
    document.getElementById("drop_zone").style.backgroundColor = "#fff";
  }

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

  function deleteFile(index) {
    const fileToDelete = $files[index];
    setFiles($files.filter((_, i) => i !== index));

    embeddings.update((arr) => {
      const updatedEmbeddings = [...arr];
      updatedEmbeddings.splice(index, 1);
      return updatedEmbeddings;
    });
  }

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
    <h1>DocPlot</h1>
    <div id="content">
      <div id="left-gutter">
        <div
          id="drop_zone"
          on:drop={dropHandler}
          on:dragover={dragOverHandler}
          role="button"
          tabindex="0"
        >
          <p>Drag plain text files here.</p>
        </div>

        <h2>Files</h2>
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
          {:else}
            <p
              style="text-align: center; align-self: center; color: #bbb; font-size: 400%; margin:auto;"
            >
              ∅
            </p>
          {/if}
        </div>
      </div>
      <div id="right-gutter">
        <Ranker {queryEmbedding} />
        <input style="font-size: 100%;" id="query-input" bind:value={query} />
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
    text-align: center;
  }
  #drop_zone {
    padding-top: 0.5em;
    border: 1px solid #ccc;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
    padding: 25px;
    text-align: center;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
    min-width: fit-content;
  }

  #file-list {
    border: 1px solid #ccc;
    flex-grow: 1;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
    overflow: scroll;
  }

  #file {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5em;
    border-bottom: 1px solid #ccc;
    background: #fff;
  }

  #right-gutter {
    flex-grow: 1;
    margin-right: 1em;
  }

  #file:hover {
    background: #efefef;
  }

  #query-input {
    width: 100%;
    padding: 0.5em;
    border: 1px solid #ccc;
  }

  #app {
    height: 100vh;
  }

  #content {
    height: 87vh;
    display: flex;
    flex-direction: row;
    gap: 1em;
  }

  #left-gutter {
    display: flex;
    flex-direction: column;
    width: 30%;
    height: 100%;
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
