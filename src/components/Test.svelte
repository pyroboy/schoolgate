
<script>
  import { getClient, query , subscribe }from "svelte-apollo";
  const client = getClient();
  import { gql } from "apollo-boost";
  const SCANS = gql`
    {
      scanned(order_by: { created_at: desc }) {
        scan
      }
    }
  `;

  const NEW_SCANS = gql`
  subscription {
  scanned(limit: 1, order_by: {created_at: desc}) {
    scan
  }
}
  `;


  let scans = query(client, { query: SCANS });
  let new_scans = subscribe(client, { query: NEW_SCANS });
  console.log(new_scans);
  
</script>

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



{#await $scans}
  Loading...
{:then result}
  {#each result.data.scanned as scan}
    {scan.scan}
    <br />
  {/each}
{:catch error}
  Error: {error}
{/await}
