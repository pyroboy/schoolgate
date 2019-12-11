<script context="module">
  import {gql} from 'graphql-tag';
  import { client } from '../routes/_apollo';
  import { subscribe } from 'svelte-apollo';
  const QUERY = gql`
subscription {
  scanned(order_by: {created_at: desc}) {
    scan
  }
}
  `;
  const Scans = subscribe(client, { query: QUERY });
</script>

<ul>
  {#await $Scans}
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