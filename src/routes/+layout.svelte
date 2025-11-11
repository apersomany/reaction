<script>
	import favicon from "$lib/assets/favicon.svg";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<style>
		body {
			margin: 0;
			overflow: hidden;
			user-select: none;
		}
	</style>
</svelte:head>

{@render children?.()}
