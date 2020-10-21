<script lang="ts">
    import {navigateTo} from "../../kernel/main"
</script>

<h1 class="text-primary text-3xl font-bold pb-2">Register</h1>
<div class="col sm:w-1/2">
    <p class="text-lg text-primary mb-4">Your new GnosisSafe Address: <br>0xai7s6drtf8aubwl3diugasdo8fuga329</p>
    <div class="box border rounded flex flex-col shadow bg-white">
    <div class="box__title bg-grey-lighter px-3 py-2 border-b"><h3 class="text-sm  text-primary font-medium">Please save your Seedphrase*</h3></div>
    <textarea placeholder="word1 word2 word3 word4 .... word23 word24" class="text-primary flex-1 p-2 m-1 bg-transparent"></textarea>
    </div>
<button class="mt-2" on:click={()=>navigateTo("wallet","unlockSafe")}>Yes I have saved my Seedphrase</button>
<p class="text-xs mt-2 text-gray-500">*Your seedphrase is like you password, please write it down and store it somewhere save. When you lose your seedphrase you will never be able to login or recover your Circles Account</p>

</div>


<button on:click="{()=>navigateTo("wallet","index")}">zum index</button>