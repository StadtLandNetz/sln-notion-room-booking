<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { BookingItem, Room } from '$lib/notion';
	import type { PageData } from './$types';

	export let data: PageData;

	// Daten aus dem load()-Ergebnis
	const currentItems: BookingItem[] = data.currentItems;
	const futureItems: BookingItem[] = data.futureItems;
	const rooms: Room[] = data.rooms.sort((a, b) => a.room.localeCompare(b.room));

	// Map roomUUID -> { current: BookingItem[], future: BookingItem[] }
	const roomItemMap: Record<string, { current: BookingItem[]; future: BookingItem[] }> = {};

	rooms.forEach((room) => {
		roomItemMap[room.roomUUID] = {
			current: currentItems.filter((i) => i.roomUUID === room.roomUUID),
			future: futureItems.filter((i) => i.roomUUID === room.roomUUID)
		};
	});

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
	<h1>SLN Office</h1>
	<p>{timeString} Uhr</p>

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
			<tr>
				<td colspan="4" style="" class="devider"> </td>
			</tr>
			{#each rooms as room}
				{#if room.roomUUID !== ''}
					<!-- Raumüberschrift -->
					<tr>
						<td colspan="4" class="room-cell">
							<h2><a href="/{room.roomUUID}" class="room-title">{room.room}</a></h2>
							<code class="room-uuid">{room.roomUUID}</code>
						</td>
					</tr>

					<!-- Keine Items? -->
					{#if roomItemMap[room.roomUUID].current.length === 0 && roomItemMap[room.roomUUID].future.length === 0}
						<tr>
							<td colspan="4" class="room">no bookings today anymore</td>
						</tr>
					{/if}

					<!-- Aktuelle Buchungen -->
					{#each roomItemMap[room.roomUUID].current as item}
						<tr class="current">
							<td><span class="status-current">{item.user.join(', ')}</span></td>
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
					{#each roomItemMap[room.roomUUID].future as item}
						<tr class="future">
							<td><span class="status-future">{item.user.join(', ')}</span></td>
							<td>
								{item.from.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
							</td>
							<td>
								{item.to.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })} Uhr
							</td>
							<td>{item.duration}</td>
						</tr>
					{/each}
					<tr>
						<td colspan="4" style="" class="devider"> </td>
					</tr>
				{/if}
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
</div>

<style>
	.container {
		margin: 0 auto;
		max-width: 100%;
		padding: 25px;
	}
	h1 {
		font-size: 32px;
	}
	h2 {
		font-size: 24px;
		float: left;
		font-weight: bold;
	}
	.room-title {
		color: inherit;
		text-decoration: none;
		cursor: pointer;
	}
	.room-title:hover {
		color: #007bff;
		text-decoration: underline;
	}
	.room-cell {
		position: relative;
	}
	.room-uuid {
		font-size: 12px;
		float: right;
		margin-top: 10px;
		opacity: 0;
		transition: opacity 0.2s ease;
	}
	.room-cell:hover .room-uuid {
		opacity: 1;
	}
	table {
		width: 900px;
		max-width: 100%;
		margin: 0 auto;
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
		/* font-weight: bold; */
		border: 2px solid #abdaa6;
	}
	tr.future {
		color: #5a5a5a;
	}
	.devider,
	.room {
		text-align: center;
		opacity: 0.6;
	}
	.devider {
		font-size: 10px;
		border-left: transparent;
		border-right: transparent;
	}
	.logo {
		width: 64px;
		float: right;
	}

	/* Mobile responsive design für Displays < 1000px - nur für Hauptseite */
	@media (max-width: 999px) {
		.container {
			padding: 10px;
		}

		table {
			width: 100%;
		}

		h1 {
			font-size: 20px;
		}

		h2 {
			font-size: 14px;
		}

		p {
			font-size: 12px;
		}

		td,
		th {
			padding: 0.2em;
			font-size: 10px;
		}

		.room-uuid {
			font-size: 8px;
			margin-top: 5px;
		}

		.room-title {
			font-size: 12px;
		}

		.logo {
			width: 32px;
		}

		.devider {
			font-size: 8px;
		}
	}

	/* Sehr kompakte Darstellung für kleinste Screens */
	@media (max-width: 600px) {
		.container {
			padding: 5px;
		}

		h1 {
			font-size: 16px;
		}

		h2 {
			font-size: 12px;
		}

		td,
		th {
			padding: 0.1em;
			font-size: 9px;
		}

		.room-title {
			font-size: 10px;
		}

		.room-uuid {
			font-size: 7px;
		}
	}
</style>
