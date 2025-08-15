<script lang="ts">
	import type { BookingItem } from '$lib/notion';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Daten aus dem load()-Ergebnis
	const currentItems: BookingItem[] = data.currentItems;
	const futureItems: BookingItem[] = data.futureItems;
	const room = data.room;
	const roomParam = data.roomParam;
	const baseUrl = data.baseUrl;

	// Aktuelle Zeit für verbleibende Zeit-Berechnung
	const now = new Date();

	function calculateRemainingTime(to: Date, currentNow: Date): string {
		const diff = to.getTime() - currentNow.getTime();
		const minutes = Math.floor(diff / 60000);
		return `${minutes} min verbleibend`;
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>SLN Office - {room?.room || roomParam} | TRMNL</title>
	<meta name="description" content="Raumbuchungen für {room?.room || roomParam}" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div
	style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;"
>
	<div>
		<h1 style="font-size: 24px; font-weight: bold; color: #000; margin: 0;">
			SLN Office - {room?.room || roomParam}
		</h1>
		<p style="font-size: 14px; color: #666; margin: 0;">
			{now.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} Uhr
		</p>
	</div>
	<div
		style="font-size: 18px; font-weight: bold; color: #000; padding: 4px 8px; text-align: center;"
	>
		<img
			class="logo"
			style="text-align: right; width:50px;"
			src="{baseUrl}/logo.png"
			alt="SLN Logo"
		/>
	</div>
</div>

{#if !room}
	<div style="text-align: center; padding: 20px; border: 2px solid #000; background: #f0f0f0;">
		<p>Raum "{roomParam}" nicht gefunden.</p>
	</div>
{:else if currentItems.length === 0 && futureItems.length === 0}
	<div style="text-align: center; color: #666; font-style: italic; padding: 20px;">
		<p>Keine Buchungen für heute</p>
	</div>
{:else}
	<!-- Erstes aktuelles Item als Hero -->
	{#if currentItems.length > 0}
		{@const firstItem = currentItems[0]}
		<div style="background: #000; color: #fff; padding: 20px; margin: 20px 0; text-align: center;">
			<div style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">
				{calculateRemainingTime(firstItem.to, now)}
			</div>
			<div style="font-size: 14px; margin-bottom: 8px;">
				{formatTime(firstItem.from)} - {formatTime(firstItem.to)} Uhr
			</div>
			<div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">
				{firstItem.title || 'Buchung'}
			</div>
			<div style="font-size: 18px; font-weight: bold;">
				{firstItem.user.join(', ')}
			</div>
		</div>
	{/if}

	<!-- Weitere Buchungen als Liste -->
	<div style="margin: 20px 0;">
		<!-- Weitere aktuelle Buchungen -->
		{#each currentItems.slice(1) as item}
			<div style="background: #000; color: #fff; padding: 8px; margin-bottom: 4px;">
				<div style="font-weight: bold; font-size: 14px;">■ AKTIV: {item.user.join(', ')}</div>
				<div>VON {formatTime(item.from)} Uhr BIS {formatTime(item.to)} Uhr</div>
				<div>NOCH {calculateRemainingTime(item.to, now)}</div>
			</div>
		{/each}

		<!-- Zukünftige Buchungen -->
		{#each futureItems as item}
			<div style="color: #333; padding: 8px 0; border-bottom: 1px solid #ccc;">
				<div style="font-weight: bold; font-size: 14px;">□ GEPLANT: {item.user.join(', ')}</div>
				<div>VON {formatTime(item.from)} Uhr BIS {formatTime(item.to)} Uhr</div>
				<div>DAUER {item.duration}</div>
			</div>
		{/each}
	</div>
{/if}
