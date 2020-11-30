// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
	
			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// TODO - Get player_id and track_id from the store
	//
	const player_id_store = store.player_id;//use const to avoid variable mutation
	const track_id_store = store.track_id;

	try {

		/*
		 *first - create race with player and tracker id
		 *second - store race id from API in the store
		 *third - run countdown and WAIT for it
		 *fourth - start race with id from store and WAIT for it
		 *fifth - run race with id from store and WAIT for it
		 * */
		
		// const race = TODO - invoke the API call to create the race, then save the result
		const race = await createRace(player_id_store, track_id_store);//using await to make the API call since the function returns a Promise

		renderAt('#race', renderRaceStartView(race.Track, race.Cars));

		// TODO - update the store with the race id
		store.race_id = race.ID - 1;//subtract by 1 - value starts from 1 but it needs to start from 0 to avoid array out of bounds
		
		// The race has been created, now start the countdown
		// TODO - call the async function runCountdown
		await runCountdown();//another Promise - have to wait for countdown to finish before starting race, so use await

		// TODO - call the async function startRace
		await startRace(store.race_id);//this is an API call - starts the race on the server's end - implementation of this function is at the end of the file

		// TODO - call the async function runRace
		await runRace(store.race_id);//this function actually runs the race and checks the game's status - in-progress or finished - and acts accordingly

	} catch (err) {
		console.error(err);//error handling w/ console.error
	}
}

function runRace(raceID) {
	return new Promise(resolve => {
	// TODO - use Javascript's built in setInterval method to get race info every 500ms
		let raceInterval = setInterval(() => {//every 500ms
			//getRace(raceID) - get information about the race
			//.status contains current progress of game - if it is finished or in-progress still
			getRace(raceID).then((race_response) => {//after info about the race from the API has been retrieved with getRace, which returns a Promise
	/* 
		TODO - if the race info status property is "in-progress", update the leaderboard by calling:

		renderAt('#leaderBoard', raceProgress(res.positions))
	*/

				//check if game still in progress
				//if so, show the leaderboard as the game is in progress
				if (race_response.status === "in-progress") {//status identifies whether game is in progress
					renderAt('#leaderBoard', raceProgress(race_response.positions));//render leaderboard with the info from API
				} 

				//if the game is finished
				//clear the interval - stop getting progress of race
				//show the final results of the race
				//resolve the Promise to finish the race
				if (race_response.status === "finished") {
					clearInterval(raceInterval);//stop getting info about the game since it is done and finish
					renderAt('#race', resultsView(race_response.positions));//render final results
					resolve(race_response);//resolve Promise
				}
			})
			.catch((err) => console.error(err));//error handling w/ console.error
		}, 500);

	/* 
		TODO - if the race info status property is "finished", run the following:

		clearInterval(raceInterval) // to stop the interval from repeating
		renderAt('#race', resultsView(res.positions)) // to render the results view
		reslove(res) // resolve the promise
	*/
	})
	.catch((err) => console.error(err));//error handling for outer promise
	// remember to add error handling for the Promise
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3;//this variable will be decremented by 1 for each interval

		return new Promise(resolve => {
			// TODO - use Javascript's built in setInterval method to count down once per second
			let counting_interval = setInterval(function() {
				timer--;//decrease timer every second (parameter for 1000ms below)
				// run this DOM manipulation to decrement the countdown for the user
				// if the timer is greater than or equal to zero, keep showing the countdown
				if (timer >= 0)
					document.getElementById('big-numbers').innerHTML = timer;//set to countdown time

				// TODO - if the countdown is done, clear the interval, resolve the promise, and return
				//the countdown is done when the timer is less than or equal to zero
				//then the interval is cleared => stop running countdown
				//resolve Promise with true to start race
				if (timer <= 0) {
					clearInterval(counting_interval);//stop countdown (clear interval that counts down every second after the timer reaches 0)
					resolve(true);//resolve Promise
					return;
				}
			}, 1000);

		});
	} catch(error) {
		console.error(error);//error handling
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected racer to the store
	store.player_id = parseInt(target.id);//parseInt to convert string to int
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected track id to the store
	store.track_id = parseInt(target.id);//similar as above - parseInt to convert string to int
}

function handleAccelerate() {
	console.log("accelerate button clicked")
	// TODO - Invoke the API call to accelerate
	accelerate(store.race_id);//API call for accelerate - no await during the race
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name} - ${Math.round((p.segment/201)*100)}%</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints 

function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	
	return fetch(`${SERVER}/api/tracks`, {//use defaultFetchOpts() to return object containing request parameters
		...defaultFetchOpts()
	})
	.then(track_response => track_response.json())
	.catch(err => console.error('Problem with getTracks request: ', err))//eror handling
}

function getRacers() {
	// GET request to `${SERVER}/api/cars`
	return fetch(`${SERVER}/api/cars`, {//use defaultFetchOpts() to return object containing request parameters
		...defaultFetchOpts()
	})
	.then(racers_response => racers_response.json())
	.catch(err => console.error('Problem with getCars request: ', err));//error handling
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(create_race_response => create_race_response.json())
	.catch(err => console.error("Problem with createRace request: ", err))//error handling
}

function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	return fetch(`${SERVER}/api/races/${id}`, {
		...defaultFetchOpts(),//default request parameters
	})
	.then(get_race_response => get_race_response.json())
	.catch(err => console.error('Problem with getRace request: ', err));//error handling
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),//default request parameters
	})
	.catch(err => console.error("Problem with startRace request: ", err));//error handling
}

function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request

	//returning fetch - returns a Promise
	//error handling - use console.error
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.catch(err => console.error("Problem with accelerate request: ", err));
}
