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

<div class="header">
	<div>
		<h1 class="title">SLN Office - {room?.room || roomParam}</h1>
		<p class="time">{now.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} Uhr</p>
	</div>
	<img class="logo" src="{baseUrl}/logo.png" alt="SLN Logo" />
</div>

{#if !room}
	<div class="error">
		<p>Raum "{roomParam}" nicht gefunden.</p>
	</div>
{:else if currentItems.length === 0 && futureItems.length === 0}
	<div class="no-bookings">
		<p>Keine Buchungen für heute</p>
	</div>
{:else}
	<!-- Erstes aktuelles Item als Hero -->
	{#if currentItems.length > 0}
		{@const firstItem = currentItems[0]}
		<div class="hero-item">
			<div class="hero-time">
				{calculateRemainingTime(firstItem.to, now)}
			</div>
			<div class="hero-details">
				{formatTime(firstItem.from)} - {formatTime(firstItem.to)} Uhr
			</div>
			<div class="hero-title">
				{firstItem.title || 'Buchung'}
			</div>
			<div class="hero-user">
				{firstItem.user.join(', ')}
			</div>
		</div>
	{/if}

	<!-- Weitere Buchungen als Liste -->
	<div class="booking-list">
		<!-- Weitere aktuelle Buchungen -->
		{#each currentItems.slice(1) as item}
			<div class="booking-item current">
				<div class="booking-label">■ AKTIV: {item.user.join(', ')}</div>
				<div>VON {formatTime(item.from)} Uhr BIS {formatTime(item.to)} Uhr</div>
				<div>NOCH {calculateRemainingTime(item.to, now)}</div>
			</div>
		{/each}

		<!-- Zukünftige Buchungen -->
		{#each futureItems as item}
			<div class="booking-item future">
				<div class="booking-label">□ GEPLANT: {item.user.join(', ')}</div>
				<div>VON {formatTime(item.from)} Uhr BIS {formatTime(item.to)} Uhr</div>
				<div>DAUER {item.duration}</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	/* TRMNL-optimiertes CSS - komplett inline */
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
		line-height: 1.4;
		color: #000;
		background-color: #fff;
		font-size: 16px;
		padding: 15px;
		margin: 0;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		border-bottom: 2px solid #000;
		padding-bottom: 10px;
	}

	.title {
		font-size: 24px;
		font-weight: bold;
		color: #000;
		margin: 0;
	}

	.time {
		font-size: 14px;
		color: #666;
		margin: 0;
	}

	.logo {
		width: 48px;
		height: auto;
		filter: grayscale(100%) contrast(150%);
	}

	/* Hero-Item für TRMNL */
	.hero-item {
		background: #000;
		color: #fff;
		padding: 20px;
		margin: 20px 0;
		text-align: center;
	}

	.hero-time {
		font-size: 36px;
		font-weight: bold;
		margin-bottom: 10px;
	}

	.hero-details {
		font-size: 14px;
		margin-bottom: 8px;
	}

	.hero-title {
		font-size: 16px;
		font-weight: bold;
		margin-bottom: 4px;
	}

	.hero-user {
		font-size: 18px;
		font-weight: bold;
	}

	/* Listen-Layout statt Tabellen */
	.booking-list {
		margin: 20px 0;
	}

	.booking-item {
		padding: 8px 0;
		border-bottom: 1px solid #ccc;
	}

	.booking-item.current {
		background: #000;
		color: #fff;
		padding: 8px;
		margin-bottom: 4px;
		border: none;
	}

	.booking-item.future {
		color: #333;
	}

	.booking-label {
		font-weight: bold;
		font-size: 14px;
	}

	.no-bookings {
		text-align: center;
		color: #666;
		font-style: italic;
		padding: 20px;
	}

	.error {
		text-align: center;
		padding: 20px;
		border: 2px solid #000;
		background: #f0f0f0;
	}

	/* Kompakte Darstellung */
	@media (max-width: 600px) {
		:global(body) {
			padding: 10px;
			font-size: 14px;
		}
		
		.title {
			font-size: 20px;
		}
		
		.hero-time {
			font-size: 28px;
		}
	}
</style>