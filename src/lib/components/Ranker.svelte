<script>
  import { onMount } from "svelte";
  import { embeddings } from "$lib/stores/Embeddings";
  import { files } from "$lib/stores/Files";

  export let queryEmbedding = [];

  $: queryEmbedding, updateRank();

  $: $embeddings, updateRank();

  $: Rank = [];

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
    else return false;
}

  const updateRank = () => {
    if ($embeddings.length > 0 && queryEmbedding.length > 0) {
      console.log("Reranking!");
      Rank = $embeddings
        .map((embedding, index) => {
          return {
            name: $files[index].name,
            similarity: similarity(queryEmbedding, embedding),
          };
        })
        .sort((a, b) => b.similarity - a.similarity);
    }
  };

  onMount(() => {
    if ($embeddings.length > 0) {
      updateRank();
    }
  });
</script>

<div style="flex-grow: 1;">
  {#if Rank.length > 0}
    <ol>
      {#each Rank as { name, similarity }, i}
        <li><span>{Math.trunc(similarity * 100)}%—</span>{name}</li>
      {/each}
    </ol>
  {:else}
    <p>Ranking will appear here.</p>
  {/if}
</div>

<style>
  ol {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 0.5rem;
  }

  span {
    color: #666;
  }
</style>