<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { BookingItem } from '$lib/notion';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const currentItems: BookingItem[] = data.currentItems;
	const futureItems: BookingItem[] = data.futureItems;
	const room = data.room;
	const roomParam = data.roomParam;

	let selectedDuration = $state<string>('');
	let customTitle = $state<string>('');
	let isBooking = $state<boolean>(false);

	// Verfügbarkeit für verschiedene Zeiträume prüfen
	function checkAvailability(durationMinutes: number): boolean {
		const now = new Date();
		const startTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 Minuten Puffer
		const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
		
		const allItems = [...currentItems, ...futureItems];
		
		for (const item of allItems) {
			if (startTime < item.to && endTime > item.from) {
				return false; // Überschneidung
			}
		}
		
		return true;
	}

	// Buchungsoptionen
	const bookingOptions = [
		{ duration: 30, label: '30 minutes', available: checkAvailability(30) },
		{ duration: 60, label: '60 minutes', available: checkAvailability(60) },
		{ duration: 90, label: '90 minutes', available: checkAvailability(90) }
	];

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('de-DE', { 
			hour: '2-digit', 
			minute: '2-digit', 
			hour12: false,
			timeZone: 'Europe/Berlin'
		});
	}

	function getEndTime(durationMinutes: number): string {
		const now = new Date();
		const startTime = new Date(now.getTime() + 2 * 60 * 1000);
		const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
		return formatTime(endTime);
	}

	function handleCancel() {
		goto(`/${roomParam}`);
	}
</script>

<svelte:head>
	<title>Book Room - {room?.room || roomParam}</title>
	<meta name="description" content="Quick booking for {room?.room || roomParam}" />
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Book Room: {room?.room || roomParam}</h1>
		<button class="cancel-btn" onclick={handleCancel}>← Back</button>
	</div>

	{#if !room}
		<div class="error">
			<p>Room "{roomParam}" not found.</p>
		</div>
	{:else}
		<!-- Error/Success Messages -->
		{#if form?.message}
			<div class="message {form.message.includes('Failed') || form.message.includes('not available') ? 'error' : 'success'}">
				{form.message}
			</div>
		{/if}

		<!-- Current Status -->
		<div class="status-section">
			<h2>Current Status</h2>
			{#if currentItems.length > 0}
				<div class="status occupied">
					<strong>OCCUPIED</strong> until {formatTime(currentItems[0].to)} Uhr
					<br>
					<span class="details">{currentItems[0].title || 'Meeting'} - {currentItems[0].user.join(', ')}</span>
				</div>
			{:else}
				<div class="status free">
					<strong>FREE</strong> - Available for booking
				</div>
			{/if}
		</div>

		<!-- Quick Booking Section -->
		<div class="booking-section">
			<h2>Quick Booking</h2>
			<p>Book this room starting in 2 minutes:</p>
			
			<form method="POST" action="?/book" use:enhance={() => {
				isBooking = true;
				return async ({ update }) => {
					await update();
					isBooking = false;
				};
			}}>
				<!-- Duration Selection -->
				<div class="duration-grid">
					{#each bookingOptions as option}
						<label class="duration-option {option.available ? '' : 'disabled'}">
							<input 
								type="radio" 
								name="duration" 
								value={option.duration} 
								bind:group={selectedDuration}
								disabled={!option.available || isBooking}
							>
							<div class="duration-card">
								<div class="duration-time">{option.label}</div>
								<div class="duration-end">Until {getEndTime(option.duration)} Uhr</div>
								{#if !option.available}
									<div class="not-available">Not Available</div>
								{/if}
							</div>
						</label>
					{/each}
				</div>

				<!-- Title Input -->
				<div class="title-section">
					<label for="title">Meeting Title:</label>
					<input 
						type="text" 
						name="title" 
						id="title"
						bind:value={customTitle}
						placeholder="Enter meeting title..."
						required
						disabled={isBooking}
					>
				</div>

				<!-- Submit Button -->
				<button 
					type="submit" 
					class="book-btn"
					disabled={!selectedDuration || !customTitle || isBooking}
				>
					{#if isBooking}
						Booking...
					{:else}
						Book {selectedDuration} minutes
					{/if}
				</button>
			</form>
		</div>

		<!-- Future Bookings -->
		{#if futureItems.length > 0}
			<div class="future-section">
				<h2>Upcoming Bookings</h2>
				{#each futureItems as item}
					<div class="future-item">
						<div class="time-range">
							{formatTime(item.from)} - {formatTime(item.to)} Uhr
						</div>
						<div class="item-details">
							<strong>{item.title || 'Meeting'}</strong>
							<br>
							{item.user.join(', ')}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.container {
		margin: 0 auto;
		max-width: 600px;
		padding: 20px;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
		border-bottom: 2px solid #eee;
		padding-bottom: 15px;
	}

	h1 {
		margin: 0;
		font-size: 24px;
		color: #333;
	}

	h2 {
		font-size: 18px;
		margin-bottom: 15px;
		color: #555;
	}

	.cancel-btn {
		background: #f5f5f5;
		border: 1px solid #ddd;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		text-decoration: none;
		color: #666;
	}

	.cancel-btn:hover {
		background: #e9e9e9;
	}

	.error {
		background: #fee;
		color: #c33;
		padding: 15px;
		border-radius: 4px;
		margin-bottom: 20px;
	}

	.message {
		padding: 15px;
		border-radius: 4px;
		margin-bottom: 20px;
	}

	.message.error {
		background: #fee;
		color: #c33;
		border: 1px solid #fcc;
	}

	.message.success {
		background: #efe;
		color: #3c3;
		border: 1px solid #cfc;
	}

	.status-section, .booking-section, .future-section {
		margin-bottom: 30px;
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.status {
		padding: 15px;
		border-radius: 4px;
		text-align: center;
	}

	.status.occupied {
		background: #333;
		color: white;
	}

	.status.free {
		background: #666;
		color: white;
	}

	.details {
		font-size: 14px;
		opacity: 0.9;
	}

	.duration-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 15px;
		margin-bottom: 20px;
	}

	.duration-option {
		cursor: pointer;
	}

	.duration-option.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.duration-card {
		border: 2px solid #ddd;
		border-radius: 8px;
		padding: 15px;
		text-align: center;
		transition: all 0.2s ease;
	}

	.duration-option input {
		display: none;
	}

	.duration-option input:checked + .duration-card {
		border-color: #007bff;
		background: #f0f8ff;
	}

	.duration-option:not(.disabled):hover .duration-card {
		border-color: #999;
	}

	.duration-time {
		font-size: 18px;
		font-weight: bold;
		margin-bottom: 5px;
	}

	.duration-end {
		font-size: 14px;
		color: #666;
	}

	.not-available {
		color: #c33;
		font-size: 12px;
		margin-top: 5px;
	}

	.title-section {
		margin-bottom: 20px;
	}

	.title-section label {
		display: block;
		margin-bottom: 5px;
		font-weight: bold;
	}

	.title-section input {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 16px;
	}

	.book-btn {
		width: 100%;
		padding: 15px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
	}

	.book-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.book-btn:not(:disabled):hover {
		background: #0056b3;
	}

	.future-item {
		display: flex;
		gap: 15px;
		padding: 10px 0;
		border-bottom: 1px solid #eee;
	}

	.future-item:last-child {
		border-bottom: none;
	}

	.time-range {
		font-weight: bold;
		white-space: nowrap;
		min-width: 140px;
	}

	.item-details {
		flex: 1;
		font-size: 14px;
	}

	@media (max-width: 600px) {
		.container {
			padding: 15px;
		}

		.header {
			flex-direction: column;
			gap: 10px;
			align-items: stretch;
		}

		.duration-grid {
			grid-template-columns: 1fr;
		}

		.future-item {
			flex-direction: column;
			gap: 5px;
		}
	}
</style>