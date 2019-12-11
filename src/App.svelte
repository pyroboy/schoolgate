
<script>
	import ApolloClient from 'apollo-client'; //check
	import { client } from './apollo';                //check
	import { setClient } from 'svelte-apollo'; //check
	import Scans, { preload as scannedPreload } from './components/Scans.svelte';
	import ScansSub from './components/ScansSub.svelte';

  const scannedPreloading = scannedPreload();
  setClient(client);
  
  console.log("rat");
  import { onMount } from "svelte";
  let src = "tutorial/image.gif";
  import "bulma/css/bulma.css";
  import { Button } from "svelma";
  import moment from "moment";

  var update = () => {
    document.getElementById("now").innerHTML = moment().format("h:mm:ss");
    document.getElementById("period").innerHTML = moment().format("A");
  };
  setInterval(update, 1000);

  let genders = ["women", "men"];
  let gender = genders[Math.floor(Math.random() * 2)];
  let randomNumber = Math.floor(Math.random() * 80);
</script>

<style>
  .grid {
    display: grid !important;
    grid-template-columns: 1fr minmax(0, 90%) 1fr;
    padding-top: 5%;
    margin-bottom: auto;
    height: 100vh;
    background-color: dimgray;
  }

  #header {
    max-height: 20vh;
  }

  .grid * {
    grid-column: 2/3;
  }

  @media only screen and (max-width: 600px) {
    #header {
      background-color: lightblue !important;
    }
  }
  /* Portrait */
  @media only screen and (max-width: 768px) {
    #picture-id {
      flex-direction: row !important;
    }
    #layout {
      flex-direction: column !important;
    }
    #now {
      font-size: 3rem !important;
    }
    #period {
      font-size: 2rem !important;
    }
  }
  @media screen and (orientation: portrait) {
    .is-4 {
      width: 100% !important;
    }
    #id-number {
      font-size: 1rem !important;
    }
  }

  @media screen and (orientation: landscape) {
    #picture-id {
      flex-direction: column !important;
    }
    #layout {
      flex-direction: row !important;
    }
    .grid {
      padding-top: 1%;
      grid-template-columns: 1fr minmax(0, 98%) 1fr;
    }
  }

  #picture-id {
    flex-direction: column;
  }
  .space-group {
      display: flex;
    justify-content: space-between;
      flex-direction: column;
  }
  .center-box {
    background-color: #f5f5f5;
    color: #7a7a7a;
    padding: 1.25rem 0;
    position: relative;
    text-align: center;
    min-height: 100%;
    overflow-y: auto;
    align-self: flex-end;
  }

  .is-fullheight {
    min-height: 100vh;
  }
</style>


  <section class="hero is-fullheight">
    <div class=" grid">

        <div class="column">
          <div
            id="header"
            class="column"
            style="background-color: coral; align-items: center;">

            <div class="columns is-mobile is-multiline is-gapless">
              <div class="column is-narrow is-paddingless">
                <figure class="image is-64x64">
                  <img
                    src="https://i.pinimg.com/474x/a3/4e/ef/a34eef6b581ad41202b0abdeacddfb84--school-logo-random-thoughts.jpg"
                    alt="" />
                </figure>
              </div>
              <div class="column is-narrow">
                <p
                  class="title notification"
                  style="font-size: 1rem;background: none;">
                  TITLE
                </p>
              </div>
            </div>
          </div>

          <div
            class="columns is-mutliline is-mobile is-marginless is-gapless"
            id="layout">
            <div class="column is-4">
              <div
                class="columns is-mutliline is-mobile is-gapless"
                id="picture-id">
                <div class="column is-hard-right is-hard-bottom">
                  <div class="notification " id="picture">
                    <figure class="image is-1by1">
                      <img
                        src="https://randomuser.me/api/portraits/{gender}/{randomNumber}.jpg" 
                        alt="rat"/>
                    </figure>
                  </div>

                </div>
                <div class="column is-hard-bottom is-hard-top-landscape">
                  <p class="center-box subtitle is-3" id="id-number">
                    10-00234
                  </p>
                </div>

              </div>

            </div>

            <div class="column space-group">
              <div class="column is-paddingless">
                <p class="center-box title is-3 is-marginless">
                  Arturo Jose T. Magnoaaaa
                </p>
              </div>
              <div class="notification is-marginless">
                <div class="columns is-multiline is-mobile">
                  <div class="column is-narrow">
                    <p id="now" class="title" style="font-size: 5rem;">_</p>
                  </div>
                  <div class="column is-narrow">
                    <p id="period" class="title is-1" />
                  </div>
                </div>
              </div>
              <div class="columns is-multiline is-mobile is-gapless">
                <div class="column is-hard-right">
                  <p class="center-box is-primary has-text-centered">IN</p>
                </div>
                <div class="column is-hard-left">
                  <p class="center-box is-primary has-text-centered">OUT</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
 
  </section>

  <ScansSub />
	<h2>Scans</h2>

	{#await scannedPreloading}
		<p>Preloading articles....</p>
	{:then preloaded}
		<Scans {...preloaded} />
	{:catch error}
		<p>Error preloading articles: {error}</p>
	{/await}
