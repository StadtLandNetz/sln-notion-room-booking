<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	let { children } = $props();
	
	// Check for E-Ink mode from URL parameter
	let isEInk = $derived(
		browser ? 
		($page.url.searchParams.has('eink') || $page.url.searchParams.get('display') === 'eink') :
		false
	);
	
	onMount(() => {
		if (isEInk) {
			// Add E-Ink body class
			document.body.classList.add('eink-display');
		}
	});
</script>

<!-- Inline E-Ink CSS for TRMNL compatibility -->
{#if isEInk}
<style>
/* E-Ink optimierte Version - inline für TRMNL */
.eink-display table {
	display: block !important;
	width: 100% !important;
	border: none !important;
	margin-top: 10px;
}

.eink-display thead, 
.eink-display tfoot {
	display: none !important;
}

.eink-display tbody {
	display: block !important;
}

.eink-display tr {
	display: block !important;
	border: none !important;
	margin-bottom: 8px;
	padding: 8px 0;
}

.eink-display td, 
.eink-display th {
	display: inline !important;
	border: none !important;
	padding: 0 !important;
	margin: 0 !important;
	background: none !important;
}

/* Aktuelle Buchungen - einfacher schwarzer Block */
.eink-display tr.current {
	background-color: #000 !important;
	color: #fff !important;
	padding: 8px !important;
	margin-bottom: 4px !important;
	border: none !important;
}

.eink-display tr.current td {
	color: #fff !important;
	background: none !important;
}

/* Zukünftige Buchungen - normaler Text */
.eink-display tr.future {
	color: #333 !important;
	background: none !important;
	border-bottom: 1px solid #ccc !important;
	padding-bottom: 4px !important;
}

/* E-Ink Hero-Item Styling */
.eink-display .first-item-hero {
	background: #000 !important;
	color: #fff !important;
	border: 2px solid #000 !important;
	border-radius: 0 !important;
	box-shadow: none !important;
	padding: 20px !important;
	margin: 15px 0 !important;
	display: block !important;
}

.eink-display .time-remaining {
	font-size: 36px !important;
	font-weight: bold !important;
	text-align: center !important;
	margin-bottom: 10px !important;
	display: block !important;
}

.eink-display .item-details {
	display: block !important;
	text-align: center !important;
}

.eink-display .item-info {
	margin-bottom: 8px !important;
}

.eink-display .time-range {
	font-size: 14px !important;
	margin-bottom: 4px !important;
}

.eink-display .item-title {
	font-size: 16px !important;
	font-weight: bold !important;
	margin-bottom: 4px !important;
}

.eink-display .item-user {
	font-size: 18px !important;
	font-weight: bold !important;
	text-align: center !important;
}

/* Status-Symbole für E-Ink optimiert */
.eink-display .status-current::before {
	content: "■ AKTIV: ";
	font-weight: bold;
	font-size: 14px;
}

.eink-display .status-future::before {
	content: "□ GEPLANT: ";
	font-weight: bold;
	font-size: 14px;
}

/* TRMNL Room Cells */
.eink-display .room-cell {
	background: none !important;
	border: none !important;
	font-weight: bold !important;
	margin: 16px 0 8px 0 !important;
	padding: 0 !important;
}

.eink-display .devider {
	display: none !important;
}

/* Verstecke komplexe Elemente auf E-Ink */
.eink-display .loading-indicator {
	display: none !important;
}
</style>
{/if}

{#if browser && $navigating}
	<div class="loading-indicator">
		<div class="loading-spinner"></div>
		<p>Laden...</p>
	</div>
{/if}

{@render children()}

<style>
	.loading-indicator {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(255, 255, 255, 0.9);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: 9999;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-indicator p {
		margin: 0;
		font-size: 16px;
		color: #333;
	}
</style>
