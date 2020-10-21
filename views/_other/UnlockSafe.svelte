<script lang="ts">
    import {navigateTo} from "../../kernel/main";
    let notifications = [{
        title: "trusted",
        type: "trust 1",
        address: "0x765asfhopasjnfodguzagsfoiuasdfkjbaskdbfj"
    },
    {
        title: "waiting for trust 2",
        type: "trust 2",
        address: "0x765asfhopasjnfodguzagsfoiuasdfkjbaskdbfj"
    },
    {
        title: "waiting for trust 2",
        type: "trust 2",
        address: "0x765asfhopasjnfodguzagsfoiuasdfkjbaskdbfj"
    }];
</script>
<style>
    .card {
        @apply mb-2 border border-gray-200 rounded p-4
    }
</style>

<h1 class="text-primary text-3xl font-bold pb-2 border-b border-gray-400">Unlock Your Safe</h1>

<p class="text-xl text-primary mb-4">Your new GnosisSafe Address: 0xai7s6drtf8aubwl3diugasdo8fuga329</p>

<div class="mt-4 mb-2 text-xl text-primary">Waiting For Trust</div>
<p class="mb-5">Share your link to get trusted: <br> <span class="text-red-500">https://yourtrustlink.eth.link/#!/0x986dft7a8sodbfao8sdfga8sdofhbiasbdfiladsf</span></p>

{#each notifications as n}
    <div class="card">{n.title} --- {n.type} --- {n.address}</div>
{/each}

<button class="bg-gray-200 text-gray-400" on:click={()=>navigateTo("Wallet","safe")}>create account</button>
<br>

