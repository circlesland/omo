# Omo Earth

## Overview

- Website: https://omo.earth
- Chat: https://discord.gg/Rbhy4j9
- Feedback: https://github.com/omoearth/omo/issues
- Roadmap: https://github.com/omoearth/omo/projects/1
- Twitter: https://twitter.com/OmoEarth


## Install

Clone Repo 
`git clone https://github.com/omoearth/omo.git`

Enter directory 
`cd omo`

Fetch all git repositories
`npm run °`

Install all repositories
`npm run °npm`

Open your etc/hosts with 
`sudo nano /etc/hosts`

... and add the following line to the end of the file 
`127.0.0.1 omo.local`

Start
`npm run dev`

Go to your browser and open https://omo.local


## How to create a new DAPP

1. Go to github and create a new repository

2. Update the °.sh script in the /scripts folder and add the new dapp to the script 
   e.g.

`if [ -z "$(ls -A src/dapps/o-website)" ]; then
    git clone https://github.com/omoearth/o-dapp-website.git src/dapps/o-website
else
    git fetch src/dapps/o-website
fi`

3. Update the npm.sh script in the /scripts folder and add the new dapp to the script 

e.g.
`cd ../o-website
rm package-lock.json
rm -rf node_modules
npm install`

4. Run in the root folder the °.sh script with: 
`npm run °`

5. Go into your new dapp folder:
 `cd src/dapps/o-website`

6. Initalize a new npm package and follow the instructions with:

`npm init`

7. Install the repositories from the root folder with
`
cd ../../../
npm run °npm
`
   
8. Initalize the textile bucket:
`
mkdir textile
cd textile
hub buck init --org omo-marketplace-dev
`

9. Follow the instructions of the hub, use the default thread and copy and paste all the reference ipfs hash links into the readme.me of the dapp

10. Add the IPNS Hash to the Router.ts file in the appHashNameLookup variable:

`static appHashNameLookup = {
    "bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y": "o-dentity",
    "bafzbeicmtet2ytuo5jlg2jtuh4rbtfvntznwah5mt2kb4xj3zgxt2ol5ma": "o-wallet",
    "bafzbeiafbjcuy4dxnily3nbt7nab6ebdwyti3z7jgdrblnm4ivqw7hubki": "o-textile-hub",
    "bafzbeiahddbruy5letgjx6tiijzaednwr3zngtk57u3yyrjcsba7sqjbdq": "o-market",
    "bafzbeig3f5vcqj5jhhtuckbot7totpshpzsuaaq3gw24kwnpwtf5qc35my": "o-friends",
    "bafzbeihcehyawlhvltossqfhblyqeuer34yak24ctesgwnnf7aeyk33lce": "o-website"
};`

11. Add the IPNS Hash to the routes.ts enum 

12. Copy paste the github actions auto deployment script into the root folder of your new dapp and adjust the variable names
   Update the °.code-workspace 

13. Update your vs-code °.code-workspace file and add your dapp: 

`
{
    "name": "°website",
    "path": "src/dapps/o-website"
},
`

14. add first index route by copy pasting from another dapp index.json and index.html into the src/ folder of your dapp

15. Test your dapp in the browser by copy pasting your ipns hash in the browserbar.

16. Create new svelte page in o-design-system

17. Register svelte page in index.ts of o-design-system
