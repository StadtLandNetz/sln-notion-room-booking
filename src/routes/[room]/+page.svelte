<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { BookingItem } from '$lib/notion';
	import type { PageData } from './$types';
	import { formatRemainingTime } from '$lib/timeUtils';

	export let data: PageData;

	// Helper function to ensure dates are Date objects (not strings from cache)
	function ensureDateObjects(items: BookingItem[]): BookingItem[] {
		return items.map(item => ({
			...item,
			from: item.from instanceof Date ? item.from : new Date(item.from),
			to: item.to instanceof Date ? item.to : new Date(item.to)
		}));
	}

	// Reactive data from load() - updates automatically when data changes
	$: currentItems = ensureDateObjects(data.currentItems);
	$: futureItems = ensureDateObjects(data.futureItems);
	$: room = data.room;
	$: roomParam = data.roomParam;

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

	function getDisplayTime(endDate: Date, currentTime: Date): string {
		const diffMinutes = (endDate.getTime() - currentTime.getTime()) / 60000;
		
		if (diffMinutes <= 30) {
			const endTimeString = endDate.toLocaleTimeString('de-DE', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
				timeZone: 'Europe/Berlin'
			});
			return `until ${endTimeString}`;
		} else {
			return formatRemainingTime(endDate, currentTime) + " remaining";
		}
	}

	let counter = 0;
	let isRefreshing = false;

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

		// Async refresh - doesn't block UI, runs in background
		const intervalReload = setInterval(() => {
			if (!isRefreshing) {
				counter++;
				console.log('🔄 Background refresh #' + counter);
				isRefreshing = true;

				// Fire and forget - runs async without blocking
				// Use dependency identifier instead of '' to only invalidate this page's data
				invalidate('room:data').then(() => {
					console.log('✓ Refresh complete #' + counter);
					isRefreshing = false;
				}).catch((err) => {
					console.error('❌ Refresh error:', err);
					isRefreshing = false;
				});
			} else {
				console.log('⏭️  Skipping refresh - previous refresh still running');
			}
		}, 6000);

		// Aufräumen bei Komponentenausblendung
		return () => {
			clearInterval(intervalClock);
			clearInterval(intervalReload);
		};
	});
</script>

<div class="container">
	<div class="header">
		<a href="/" class="back-link" data-sveltekit-reload>← Back to overview</a>
	</div>

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
					{getDisplayTime(firstItem.to, now)}
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
						<td>{getDisplayTime(item.to, now)}</td>
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
		<!-- Action Buttons -->
		<div class="action-buttons-section">
			<a href="/{roomParam}/booking" class="action-btn booking-btn" data-sveltekit-reload>
				📅 Book Room
			</a>
			<a href="/{roomParam}/trmnl" class="action-btn trmnl-btn" data-sveltekit-reload>
				📺 TRMNL View
			</a>
		</div>
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

	.action-buttons-section {
		display: flex;
		gap: 12px;
		justify-content: center;
		margin: 20px 0;
	}

	.action-btn {
		display: inline-block;
		padding: 10px 20px;
		text-decoration: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: normal;
		transition: all 0.2s ease;
		border: 1px solid #dee2e6;
		cursor: pointer;
		flex: 1;
		text-align: center;
		max-width: 200px;
	}

	.booking-btn {
		background: #f8f9fa;
		color: #6c757d;
	}

	.booking-btn:hover {
		background: #e9ecef;
		color: #495057;
		border-color: #ced4da;
	}

	.trmnl-btn {
		background: #e7f3ff;
		color: #0066cc;
		border-color: #b3d9ff;
	}

	.trmnl-btn:hover {
		background: #cce5ff;
		color: #004c99;
		border-color: #99ccff;
	}

	.header {
		display: flex;
		justify-content: flex-start;
		padding: 10px 0;
		margin-bottom: 10px;
	}

	.back-link {
		display: inline-block;
		padding: 8px 16px;
		background: #f5f5f5;
		border: 1px solid #ddd;
		border-radius: 4px;
		color: #666;
		text-decoration: none;
		font-size: 14px;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.back-link:hover {
		background: #e9e9e9;
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

		.action-buttons-section {
			flex-direction: column;
		}

		.action-btn {
			max-width: 100%;
		}
	}
</style>
