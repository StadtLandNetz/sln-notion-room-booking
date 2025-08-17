<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { BookingItem } from '$lib/notion';
	import type { PageData } from './$types';
	import { formatRemainingTime } from '$lib/timeUtils';

	export let data: PageData;

	// Daten aus dem load()-Ergebnis
	const currentItems: BookingItem[] = data.currentItems;
	const futureItems: BookingItem[] = data.futureItems;
	const room = data.room;
	const roomParam = data.roomParam;

	let now = new Date();

	let timeString = now.toLocaleTimeString('de-DE', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'Europe/Berlin'
	});

	function calculateRemainingTime(to: Date, currentNow: Date): string {
		return formatRemainingTime(to, currentNow) + ' remaining';
	}

	let counter = 0;

	onMount(() => {
		console.log('reload page');
		// refresh time every second
		const intervalClock = setInterval(() => {
			now = new Date();
			timeString = now.toLocaleTimeString('de-DE', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
				timeZone: 'Europe/Berlin'
			});
		}, 1000);

		// refresh page every 10 seconds to reload data
		const intervalReload = setInterval(async () => {
			counter++;
			console.log('🚀 ~ intervalReload ~ counter:', counter);
			await invalidate('');
		}, 6000);

		// Aufräumen bei Komponentenausblendung
		return () => {
			clearInterval(intervalClock);
			clearInterval(intervalReload);
		};
	});
</script>

<div class="container">
	<img class="logo" src="/logo.png" alt="" />
	<h1>SLN Office - {room?.room || roomParam}</h1>
	<p>{timeString} Uhr</p>

	{#if !room}
		<div class="error">
			<p>Room "{roomParam}" nicht gefunden.</p>
		</div>
	{:else}
		<!-- Erstes aktuelles Item - große Darstellung -->
		{#if currentItems.length > 0}
			{@const firstItem = currentItems[0]}
			<div class="first-item-hero">
				<div class="time-remaining">
					{calculateRemainingTime(firstItem.to, now)}
				</div>
				<div class="item-details">
					<div class="item-info">
						<div class="time-range">
							{firstItem.from.toLocaleTimeString('de-DE', {
								hour: '2-digit',
								minute: '2-digit',
								hour12: false,
								timeZone: 'Europe/Berlin'
							})} - {firstItem.to.toLocaleTimeString('de-DE', {
								hour: '2-digit',
								minute: '2-digit',
								hour12: false,
								timeZone: 'Europe/Berlin'
							})} Uhr
						</div>
						<div class="item-title">
							{firstItem.title || 'Buchung'}
						</div>
					</div>
					<div class="item-user">
						{firstItem.user.join(', ')}
					</div>
				</div>
			</div>
		{/if}

		<table>
			<thead>
				<tr>
					<th>User</th>
					<th>Von</th>
					<th>Bis</th>
					<th>Dauer</th>
				</tr>
			</thead>
			<tbody>
				<!-- Keine Items? -->
				{#if currentItems.length === 0 && futureItems.length === 0}
					<tr>
						<td colspan="4" class="no-bookings">Keine Buchungen für heute</td>
					</tr>
				{/if}

				<!-- Aktuelle Buchungen (ohne erste, da schon oben angezeigt) -->
				{#each currentItems.slice(1) as item}
					<tr class="current">
						<td><span class="status-current">{item.user.join(', ')}</span></td>
						<td>
							{item.from.toLocaleTimeString('de-DE', {
								hour: '2-digit',
								minute: '2-digit',
								hour12: false,
								timeZone: 'Europe/Berlin'
							})} Uhr
						</td>
						<td>
							{item.to.toLocaleTimeString('de-DE', {
								hour: '2-digit',
								minute: '2-digit',
								hour12: false,
								timeZone: 'Europe/Berlin'
							})} Uhr
						</td>
						<td>{calculateRemainingTime(item.to, now)}</td>
					</tr>
				{/each}

				<!-- Zukünftige Buchungen -->
				{#each futureItems as item}
					<tr class="future">
						<td><span class="status-future">{item.user.join(', ')}</span></td>
						<td>
							{item.from.toLocaleTimeString('de-DE', {
								hour: '2-digit',
								minute: '2-digit',
								hour12: false,
								timeZone: 'Europe/Berlin'
							})} Uhr
						</td>
						<td>
							{item.to.toLocaleTimeString('de-DE', {
								hour: '2-digit',
								minute: '2-digit',
								hour12: false,
								timeZone: 'Europe/Berlin'
							})} Uhr
						</td>
						<td>{item.duration}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<th>User</th>
					<th>Von</th>
					<th>Bis</th>
					<th>Dauer</th>
				</tr>
			</tfoot>
		</table>
		<!-- Booking Button -->
		<div class="booking-button-section">
			<a href="/{roomParam}/booking" class="booking-btn"> 📅 Book Room </a>
		</div>
		<a href="/">← Zurück zur Übersicht</a>
	{/if}
</div>

<style>
	.container {
		margin: 0 auto;
		max-width: 800px;
		padding: 25px;
	}
	h1 {
		font-size: 32px;
	}
	.error {
		text-align: center;
		padding: 40px;
		color: #dc3545;
	}

	.booking-button-section {
		text-align: center;
		margin: 20px 0;
	}

	.booking-btn {
		display: inline-block;
		padding: 10px 20px;
		background: #f8f9fa;
		color: #6c757d;
		text-decoration: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: normal;
		transition: all 0.2s ease;
		border: 1px solid #dee2e6;
		cursor: pointer;
	}

	.booking-btn:hover {
		background: #e9ecef;
		color: #495057;
		border-color: #ced4da;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	td,
	th {
		padding: 0.5em;
		border: 1px solid #ccc;
		width: 25%;
	}
	th {
		background-color: #f0f0f0;
		text-align: left;
	}
	tr.current {
		background-color: #ebf3ea;
		color: #1f9012;
		border: 2px solid #abdaa6;
	}
	tr.future {
		color: #5a5a5a;
	}
	.no-bookings {
		text-align: center;
		opacity: 0.6;
		font-style: italic;
	}
	.logo {
		width: 64px;
		float: right;
	}

	/* Hero-Darstellung für das erste aktuelle Item */
	.first-item-hero {
		background: linear-gradient(135deg, #1f9012, #2db31d);
		color: white;
		border-radius: 12px;
		padding: 30px;
		margin: 20px 0 30px 0;
		display: flex;
		align-items: center;
		gap: 30px;
		box-shadow: 0 4px 12px rgba(31, 144, 18, 0.3);
	}

	.time-remaining {
		font-size: 48px;
		font-weight: bold;
		text-align: center;
		line-height: 1;
		flex-shrink: 0;
		min-width: 200px;
	}

	.item-details {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
	}

	.item-info {
		flex: 1;
	}

	.time-range {
		font-size: 16px;
		opacity: 0.9;
		margin-bottom: 8px;
		font-weight: 500;
	}

	.item-title {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 4px;
	}

	.item-user {
		font-size: 24px;
		font-weight: bold;
		text-align: right;
		flex-shrink: 0;
	}

	/* Responsive für Hero-Item */
	@media (max-width: 768px) {
		.first-item-hero {
			flex-direction: column;
			text-align: center;
			padding: 20px;
			gap: 20px;
		}

		.time-remaining {
			font-size: 36px;
			min-width: auto;
		}

		.item-details {
			flex-direction: column;
			gap: 15px;
			text-align: center;
		}

		.item-user {
			text-align: center;
			font-size: 20px;
		}
	}
</style>
