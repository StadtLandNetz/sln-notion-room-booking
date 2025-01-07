<script lang="ts">
	export let notionData: unknown[];
</script>

<h1>Notion-Daten</h1>
{#if notionData?.length}
	<ul>
		{#each notionData as entry}
			<li>{JSON.stringify(entry)}</li>
		{/each}
	</ul>
{:else}
	<p>Keine Daten vorhanden.</p>
{/if}
