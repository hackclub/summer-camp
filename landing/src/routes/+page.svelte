<script lang="ts">
	import { cdn, fallback } from '$lib/cdn';
	import Grass from '$lib/grass.svelte';
	import Sign from '$lib/sign.svelte';
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<main class="relative flex h-fit flex-col items-center overflow-x-hidden overflow-y-hidden">
	<!-- Grass -->
	{#each Array.from({ length: 256 }, (_, i) => i) as i (i)}
		<div class="pointer-events-none absolute inset-0 z-0">
			<Grass id={i} />
		</div>
	{/each}

	<div
		class="0 sm:pt-30x absolute inset-0 z-15 flex h-screen w-screen flex-col items-center gap-10 px-2 pt-80 sm:gap-20 sm:px-40 sm:pt-30 md:gap-10 md:px-20"
	>
		<img src={cdn.title} onerror={fallback('/title.png')} alt="" class="h-fit w-auto -rotate-2 object-contain" />
		<Sign type="plank">
			<p
				class="px-5 text-center font-luckiest-guy text-sm font-thin sm:text-base md:text-2xl"
			>
				A free virtual summer camp running June 23–July 17. Join us weekdays, 12–3 PM Eastern, for hands-on coding, games, and free prizes.
			</p>
		</Sign>

		{#if form?.success}
			<p class="mt-4 text-center font-luckiest-guy text-2xl text-black drop-shadow-md">
				Thanks for RSVPing! See you at camp!
			</p>
		{:else}
			<!-- RSVP Form -->
			<form
				method="POST"
				use:enhance
				class="flex w-full max-w-md flex-col items-center gap-4 sm:flex-row sm:gap-2"
			>
				<!-- Honeypot: hidden from real users; bots that fill it get silently dropped. -->
				<div class="absolute left-[-9999px]" aria-hidden="true">
					<label>
						Company
						<input type="text" name="company" tabindex="-1" autocomplete="off" />
					</label>
				</div>
				<input
					type="email"
					name="email"
					placeholder="Enter your email..."
					required
					class="w-full rounded-xl border-4 border-[#a3523b] bg-[#fecaa5] px-4 py-3 font-luckiest-guy text-lg text-[#a3523b] placeholder-[#e3ad7e] shadow-md focus:ring-4 focus:ring-[#80b464]/50 focus:outline-none"
				/>
				<button
					type="submit"
					class="w-full rounded-xl border-4 border-[#a3523b] bg-[#80b464] px-8 py-3 font-luckiest-guy text-xl whitespace-nowrap text-white shadow-md transition-transform hover:scale-105 active:scale-95 sm:w-auto"
				>
					RSVP
				</button>
			</form>
			{#if form?.missing}
				<p class="font-luckiest-guy text-xl text-[#a3523b] drop-shadow-md">Email is required!</p>
			{/if}
			{#if form?.invalid}
				<p class="font-luckiest-guy text-xl text-[#a3523b] drop-shadow-md">
					Please enter a valid email!
				</p>
			{/if}
			{#if form?.rateLimited}
				<p class="font-luckiest-guy text-xl text-[#a3523b] drop-shadow-md">
					Whoa, slow down! Try again in a few minutes.
				</p>
			{/if}
			{#if form?.error}
				<p class="font-luckiest-guy text-xl text-[#a3523b] drop-shadow-md">
					Something went wrong. Try again!
				</p>
			{/if}
		{/if}
	</div>

	<!-- <Plank text="xd" type="plank" /> -->
	<img
		src={cdn.forest}
		onerror={fallback('/forest.png')}
		alt=""
		class="z-10 h-[110vh] w-auto object-cover object-[90%_50%] sm:w-screen"
	/>

	<div class="relative z-5 -m-14 flex h-auto w-screen max-w-none flex-col items-center sm:-m-160">
		<img
			src={cdn.road}
			onerror={fallback('/road.png')}
			alt=""
			class="block h-auto w-[143vw] max-w-none translate-x-6 sm:translate-x-0"
		/>
		<div class="absolute inset-0 flex h-fit w-screen max-w-none flex-col">
			{#snippet SignAndText(
				signText: string,
				header: string,
				subheading: string,
				flipped: boolean = false
			)}
				<div
					class={[
						'flex px-1 font-luckiest-guy sm:px-20',
						flipped ? 'justify-end' : 'justify-start'
					]}
				>
					<Sign type="sign" {flipped}>
						<div class="flex flex-col items-center gap-0.5 leading-tight sm:gap-1">
							<span class="text-[7px] tracking-wide uppercase opacity-90 sm:text-base">
								{signText}
							</span>
							<span class="text-[10px] leading-none sm:text-2xl md:text-3xl">{header}</span>
							<span class="text-[5px] font-thin opacity-85 sm:text-[11px] md:text-sm">
								{subheading}
							</span>
						</div>
					</Sign>
				</div>
			{/snippet}

			<div class="h-10 sm:h-180"></div>
			{@render SignAndText('step 1', 'Grab your spot', "RSVP with your email - we'll email you with the info!", true)}

			<div class="h-5 sm:h-15"></div>
			{@render SignAndText('step 2', 'Get started', "It's okay to have no experience - just show up on day one and dive in!", false)}

			<div class="h-10 sm:h-30"></div>
			{@render SignAndText('step 3', 'Learn with others', 'Build real code projects alongside other teens in our live sessions', true)}

			<div class="h-10 sm:h-30"></div>
			{@render SignAndText('step 4', 'Win prizes', 'Earn free prizes and have fun as you go', false)}
		</div>
	</div>
	<div class="z-5 flex h-fit min-h-200 w-screen flex-col items-center bg-[#fec798] pb-20 sm:mt-160">
		<Sign type="plank">
			<p
				class="px-5 text-center font-luckiest-guy text-base font-thin sm:text-xl md:text-5xl"
			>
				FAQ
			</p>
		</Sign>

		<div class="mt-10 flex w-full max-w-3xl flex-col gap-6 px-4">
			<div class="flex flex-col gap-2 rounded-xl bg-[#e3ad7e] p-6 shadow-md">
				<h3 class="font-luckiest-guy text-xl text-[#a3523b]">Is this really free?</h3>
				<p class="text-[#a3523b]">
					Yep, completely free with no strings attached. We're part of Hack Club, a 501(c)(3) nonprofit
					behind a global network of 100,000+ teen coders and makers in over 119 countries. They've
					already shipped more than 10,000 real prizes to teens through programs like Arcade, High
					Seas, and Stardance. Every class, talk, and game here is free, and the prizes are covered
					too. No fees, no catch.
				</p>
			</div>

			<div class="flex flex-col gap-2 rounded-xl bg-[#e3ad7e] p-6 shadow-md">
				<h3 class="font-luckiest-guy text-xl text-[#a3523b]">Who can join?</h3>
				<p class="text-[#a3523b]">
					Summer camp is built for high schoolers and teens, but anyone curious about coding is
					welcome. You don't need any experience to start. We begin with the very basics and build up
					from there.
				</p>
			</div>

			<div class="flex flex-col gap-2 rounded-xl bg-[#e3ad7e] p-6 shadow-md">
				<h3 class="font-luckiest-guy text-xl text-[#a3523b]">Do I need any experience?</h3>
				<p class="text-[#a3523b]">
					Nope! Whether you've never written a line of code or you've already shipped a few projects,
					there's something here for you. Every session is hands-on and easy to follow.
				</p>
			</div>

			<div class="flex flex-col gap-2 rounded-xl bg-[#e3ad7e] p-6 shadow-md">
				<h3 class="font-luckiest-guy text-xl text-[#a3523b]">What do I need to take part?</h3>
				<p class="text-[#a3523b]">
					Just a computer with an internet connection. All the tools we use are free, and we'll walk
					you through setting everything up on day one. There's nothing to download or sign up for
					ahead of time.
				</p>
			</div>

			<div class="flex flex-col gap-2 rounded-xl bg-[#e3ad7e] p-6 shadow-md">
				<h3 class="font-luckiest-guy text-xl text-[#a3523b]">When and where does it happen?</h3>
				<p class="text-[#a3523b]">
					Camp runs June 23 to July 17, weekdays from 12 to 3 PM Eastern, and it's fully online.
					Can't make every session? No worries. Drop in whenever you can and pick up right where you
					left off.
				</p>
			</div>
		</div>
	</div>
	<footer
		class="bg-beige text-dark-brown relative px-6 pt-10 pb-8 text-white md:px-8 lg:px-18 xl:px-36 2xl:px-54"
	>
		<div class="mx-auto max-w-6xl">
			<p class=" mb-4 text-lg md:text-xl">
				A project by
				<a
					target="_blank"
					rel="noopener noreferrer"
					class="text-bp-warning underline transition-colors"
					href="https://hackclub.com?utm_source=fallout"
				>
					Hack Club
				</a>
			</p>
			<p class="text-dark-brown/75 mb-8 max-w-3xl text-sm md:text-base">
				Hack Club is a 501(c)(3) nonprofit and network of 60k+ technical high schoolers. We believe
				you learn best by building so we're creating community and providing grants so you can make
				awesome projects. In the past few years, we've
				<a
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-bp-warning underline transition-colors"
					href="https://summer.hackclub.com/"
				>
					partnered with GitHub to run Summer of Making
				</a>

				<a
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-bp-warning underline transition-colors"
					href="https://github.com/hackclub/the-hacker-zephyr"
				>
					hosted the world's longest hackathon on land
				</a>
				and
				<a
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-bp-warning underline transition-colors"
					href="https://www.youtube.com/watch?v=QvCoISXfcE8"
				>
					ran Canada's largest high school hackathon
				</a>
				.<br />
				<br />
				At Hack Club, students aren't just learning, they're shipping.
			</p>
			<div class="flex flex-wrap gap-x-16 gap-y-8">
				<div class="flex flex-col">
					<p class=" mb-3 text-base font-bold md:text-lg">Hack Club</p>
					<div class="space-y-1 text-sm md:text-base">
						<a
							class="hover:text-bp-warning block transition-colors"
							href="https://hackclub.com/philosophy/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Philosophy
						</a>
						<a
							class="hover:text-bp-warning block transition-colors"
							href="https://hackclub.com/team/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Our Team &amp; Board
						</a>
						<a
							class="hover:text-bp-warning block transition-colors"
							href="https://hackclub.com/brand/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Branding
						</a>
						<a
							class="hover:text-bp-warning block transition-colors"
							href="https://hackclub.com/philanthropy/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Donate
						</a>
					</div>
				</div>
				<div class="flex flex-col">
					<p class=" mb-3 text-base font-bold md:text-lg">Resources</p>
					<div class="space-y-1 text-sm md:text-base">
						<a
							class="hover:text-bp-warning block transition-colors"
							href="https://events.hackclub.com/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Community Events
						</a>
						<a
							class="hover:text-bp-warning block transition-colors"
							href="https://jams.hackclub.com/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Jams
						</a>
						<a
							class="hover:text-bp-warning block transition-colors"
							href="https://workshops.hackclub.com/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Workshops
						</a>
						<a
							class="hover:text-bp-warning block transition-colors"
							href="https://hackclub.com/conduct/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Code of Conduct
						</a>
					</div>
				</div>
				<div class="flex flex-col">
					<p class="mb-3 text-base font-bold md:text-lg">Contact</p>
					<div class="space-y-3 text-sm md:text-base">
						<p>
							Got any questions? <a
								class="hover:text-[#fecaa5] hover:underline"
								href="mailto:camp@hackclub.com"
							>
								Reach out to us here
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	</footer>
</main>

<style>
	:global(body) {
		background-color: #80b464;
	}
</style>
