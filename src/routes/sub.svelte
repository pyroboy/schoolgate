<svelte:head>
	<title>Subscription</title>
</svelte:head>

<script>

  import { client } from './_apollo';
  import {subscribe }from "svelte-apollo";
  import { gql } from "apollo-boost";
import { onMount } from 'svelte';

  const NEW_SCANS = gql`
subscription {
  scanned(limit: 10, order_by: {created_at: desc}) {
    scan
  }
}
  `;
  let new_scans = subscribe(client, { query: NEW_SCANS });


</script>
<h1>Subscription</h1>
<ul>
  {#await $new_scans}
    <li>Loading...</li>
  {:then result}
    {#each result.data.scanned as scanned (scanned.id)}
      <li>{scanned.scan}</li>
    {:else}
      <li>No authors found</li>
    {/each}
  {:catch error}
    <li>{error}</li>
  {/await}
</ul>
