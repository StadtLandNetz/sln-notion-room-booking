<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { BookingItem } from '$lib/notion';
	import type { PageData } from './$types';

	export let data: PageData;

	// Daten aus dem load()-Ergebnis
	const currentItems: BookingItem[] = data.currentItems;
	const futureItems: BookingItem[] = data.futureItems;
	const room = data.room;
	const roomParam = data.roomParam;

	let now = new Date();

	let timeString = now.toLocaleTimeString('de', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

	function calculateRemainingTime(to: Date, currentNow: Date): string {
		const diff = to.getTime() - currentNow.getTime();
		const minutes = Math.floor(diff / 60000);
		return `${minutes} min remaining`;
	}

	let counter = 0;

	onMount(() => {
		console.log('reload page');
		// refresh time every second
		const intervalClock = setInterval(() => {
			now = new Date();
			timeString = now.toLocaleTimeString('de', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
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
			<a href="/">← Zurück zur Übersicht</a>
		</div>
	{:else}
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

				<!-- Aktuelle Buchungen -->
				{#each currentItems as item}
					<tr class="current">
						<td>🟢 {item.user.join(', ')}</td>
						<td>
							{item.from.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
						</td>
						<td>
							{item.to.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
						</td>
						<td>{calculateRemainingTime(item.to, now)}</td>
					</tr>
				{/each}

				<!-- Zukünftige Buchungen -->
				{#each futureItems as item}
					<tr class="future">
						<td>⚪️ {item.user.join(', ')}</td>
						<td>
							{item.from.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
						</td>
						<td>
							{item.to.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
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
	.error a {
		color: #007bff;
		text-decoration: none;
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
</style>
