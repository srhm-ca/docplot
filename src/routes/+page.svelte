<script>
  import { files, setFiles } from "$lib/stores/Files";
  import { embeddings } from "$lib/stores/Embeddings";
  import { env, AutoModel, AutoTokenizer } from "@xenova/transformers";
  import Visualizer from "$lib/components/Visualizer.svelte";

  let tokenizer;
  let model;

  env.allowRemoteModels = true;

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

  initialize();
</script>

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
      <p>Drag plain text files <i>here!</i></p>
    </div>

    {#if $files.length > 0}
      <h2>Files</h2>
      {#each $files as file, i (file.name)}
        <p>{file.name}</p>
        <button on:click={() => deleteFile(i)}>Delete</button>
      {/each}
    {/if}
  </div>
  <div id="right-gutter">
    <Visualizer />
  </div>
</div>

<style>
  :root {
    font-family: sans-serif;
    padding: 1em;
    background: #efefef;
  }
  h1 {
    text-align: center;
    background: linear-gradient(
      90deg,
      #ff0000,
      #ff7f00,
      #ffff00,
      #00ff00,
      #0000ff,
      #4b0082,
      #8f00ff
    );
  }
  #drop_zone {
    border: 2px dashed #ccc;
    border-radius: 5px;
    padding: 25px;
    background: #fff;
    text-align: center;
  }

  #content {
    display: flex;
    gap: 1em;
  }

  #left-gutter {
    width: 30%;
  }
</style>
