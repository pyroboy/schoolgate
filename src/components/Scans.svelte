<script context="module">
console.log("rat");

</script>

<script>


	import { onMount } from 'svelte';
	onMount(async () => {
console.log("ratmount")
  });
  import {gql} from 'apollo-boost';

  const SCANS = gql`
{
  scanned(order_by: {created_at: desc}) {
    scan
  }
}
  `;

  export async function preload() {
    return {
      ScannedCache: await client.query({ query: SCANS })
    };
  }

  import { restore, query } from 'svelte-apollo';
  export let ScannedCache;
  restore(client, SCANS, ScannedCache.data);
  const scans = query(client, { query: SCANS});


console.log(ScannedCache);
console.log("rat");


</script>

<ul>
  {#await $scans}
    <li>Loading...</li>
  {:then result}
    {#each result.data.scanned as scan (scan.id)}
      <li>{scan.scan}</li>
    {:else}
      <li>No authors found</li>
    {/each}
  {:catch error}
    <li>Error loading authors: {error}</li>
  {/await}
</ul>
