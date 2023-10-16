// import transformers
import { env, AutoModel, AutoTokenizer } from "@xenova/transformers";
env.allowRemoteModels = true; // allow downloads from huggingface.co

let tokenizer;
let model;

// initialize tokenizer and model
async function initialize() {
  try {
    tokenizer = await AutoTokenizer.from_pretrained("Xenova/all-MiniLM-L6-v2");
    model = await AutoModel.from_pretrained("Xenova/all-MiniLM-L6-v2");
  } catch (error) {
    console.error("Error initializing tokenizer and model:", error);
  }
}

initialize().then(() => self.postMessage('Initialization completed'));

//message event handler which will call code to process text and return embeddings
self.addEventListener('message', (event) => {
  // extract text and fileName from event.data
  let { text, fileName } = event.data;

  // split the text into chunks of 512 characters
  let chunks = chunkString(text, 512);
  let chunkEmbeddings = [];
  // for each chunks, calculate the embeddings
  for (let chunk of chunks) {
    let inputs = await tokenizer(chunk, {
      truncation: true,
      padding: true,
    });
    let output = await model(inputs);
    let vector = output.last_hidden_state.data.slice(0, 384);
    chunkEmbeddings.push(vector);
    // Send progress update back to main thread
    self.postMessage({ 
      status: `Processing ${fileName}: ${chunks.indexOf(chunk) + 1}/${chunks.length}` 
    });
  }

  // calculate the average embeddings
  let avgVector = averageVectors(chunkEmbeddings);
 
  // Send back calculated embedding
  self.postMessage({ embedding: avgVector });
});