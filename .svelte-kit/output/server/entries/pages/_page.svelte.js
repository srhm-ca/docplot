import { c as create_ssr_component, a as subscribe, b as each, e as escape, v as validate_component, d as add_attribute } from "../../chunks/ssr.js";
import { w as writable } from "../../chunks/index.js";
import { env, AutoTokenizer, AutoModel } from "@xenova/transformers";
const files = writable([]);
let trackers = writable({});
files.subscribe(($files) => {
  $files.forEach((file) => trackers.update((store) => ({ ...store, [file.name]: "" })));
});
let embeddings = writable([]);
const Ranker_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: "ol.svelte-6oq8e1{list-style-type:none;padding:0;margin:0}li.svelte-6oq8e1{margin-bottom:0.5rem}span.svelte-6oq8e1{color:#666}",
  map: null
};
function similarity(a, b) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += Math.pow(a[i], 2);
    magnitudeB += Math.pow(b[i], 2);
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  if (magnitudeA && magnitudeB)
    return dotProduct / (magnitudeA * magnitudeB);
  else
    return false;
}
const Ranker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let Rank;
  let $embeddings, $$unsubscribe_embeddings;
  let $files, $$unsubscribe_files;
  $$unsubscribe_embeddings = subscribe(embeddings, (value) => $embeddings = value);
  $$unsubscribe_files = subscribe(files, (value) => $files = value);
  let { queryEmbedding = [] } = $$props;
  const updateRank = () => {
    if ($embeddings.length > 0 && queryEmbedding.length > 0) {
      console.log("Reranking!");
      Rank = $embeddings.map((embedding, index) => {
        return {
          name: $files[index].name,
          similarity: similarity(queryEmbedding, embedding)
        };
      }).sort((a, b) => b.similarity - a.similarity);
    }
  };
  if ($$props.queryEmbedding === void 0 && $$bindings.queryEmbedding && queryEmbedding !== void 0)
    $$bindings.queryEmbedding(queryEmbedding);
  $$result.css.add(css$1);
  {
    updateRank();
  }
  {
    updateRank();
  }
  Rank = [];
  $$unsubscribe_embeddings();
  $$unsubscribe_files();
  return `<div style="flex-grow: 1;">${Rank.length > 0 ? `<ol class="svelte-6oq8e1">${each(Rank, ({ name, similarity: similarity2 }, i) => {
    return `<li class="svelte-6oq8e1"><span class="svelte-6oq8e1">${escape(Math.trunc(similarity2 * 100))}%—</span>${escape(name)}</li>`;
  })}</ol>` : `<p data-svelte-h="svelte-15u4r1v">Ranking will appear here.</p>`} </div>`;
});
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ":root{font-family:sans-serif;padding:1em;background:#efefef;overflow:hidden;height:100vh}h1.svelte-1m03f3z{margin:0}#drop_zone.svelte-1m03f3z{padding-top:0.5em;border:1px solid #ccc;box-shadow:inset 0 0 5px rgba(0, 0, 0, 0.2);padding:25px;text-align:center;box-shadow:inset 0 0 5px rgba(0, 0, 0, 0.2);min-width:fit-content}#file-list.svelte-1m03f3z{border:1px solid #ccc;flex-grow:1;box-shadow:inset 0 0 5px rgba(0, 0, 0, 0.2);overflow:scroll}#file.svelte-1m03f3z{display:flex;justify-content:space-between;align-items:center;padding:0.5em;border-bottom:1px solid #ccc;background:#fff}#file.svelte-1m03f3z:hover{background:#efefef}#query-input.svelte-1m03f3z{width:100%;padding:0.5em;border:1px solid #ccc}#app.svelte-1m03f3z{height:85vh}#content.svelte-1m03f3z{padding-top:1em;height:100%;display:flex;flex-direction:row;gap:1em}#left-gutter.svelte-1m03f3z{display:flex;flex-direction:column;width:30%;height:100%;gap:1em;max-width:35ch}#right-gutter.svelte-1m03f3z{flex-grow:1;margin-right:1em;display:flex;flex-direction:column}#loading-popup.svelte-1m03f3z{position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);background:rgba(255, 255, 255, 0.9);padding:1em;border:1px solid #ccc;border-radius:5px;box-shadow:0 0 10px rgba(0, 0, 0, 0.2)}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $files, $$unsubscribe_files;
  $$unsubscribe_files = subscribe(files, (value) => $files = value);
  env.allowRemoteModels = true;
  let tokenizer;
  let model;
  let query = "";
  let queryEmbedding = [];
  async function initialize() {
    try {
      tokenizer = await AutoTokenizer.from_pretrained("Xenova/all-MiniLM-L6-v2");
      model = await AutoModel.from_pretrained("Xenova/all-MiniLM-L6-v2");
    } catch (error) {
      console.error("Error initializing tokenizer and model:", error);
    }
  }
  let isLoading = true;
  function closeLoadingPopup() {
    isLoading = false;
  }
  initialize().then(closeLoadingPopup);
  $$result.css.add(css);
  $$unsubscribe_files();
  return `<div id="app" class="svelte-1m03f3z">${isLoading ? `<div id="loading-popup" class="svelte-1m03f3z" data-svelte-h="svelte-poggzn"><p>Loading model and tokenizer...</p></div>` : `<h1 class="svelte-1m03f3z" data-svelte-h="svelte-ojpju5">DocPlot</h1> <div id="content" class="svelte-1m03f3z"><div id="left-gutter" class="svelte-1m03f3z"><div id="file-list" class="svelte-1m03f3z">${$files.length > 0 ? `${each($files, (file, i) => {
    return `<div id="file" class="svelte-1m03f3z"><p style="flex-grow: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escape(file.name)}</p> <button style="width: fit-content;" data-svelte-h="svelte-1lu38r4">Delete</button> </div>`;
  })}` : `<p style="text-align: center; align-self: center; color: #bbb; font-size: 400%; margin:auto;" data-svelte-h="svelte-ih7lga">∅</p>`}</div> <div id="drop_zone" role="button" tabindex="0" class="svelte-1m03f3z" data-svelte-h="svelte-1etenyy"><p>Drag plain text files here.</p></div></div> <div id="right-gutter" class="svelte-1m03f3z">${validate_component(Ranker, "Ranker").$$render($$result, { queryEmbedding }, {}, {})} <input style="font-size: 100%;" id="query-input" class="svelte-1m03f3z"${add_attribute("value", query, 0)}></div></div>`} </div>`;
});
export {
  Page as default
};
