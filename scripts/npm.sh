cd src/o-types
rm package-lock.json
rm -rf node_modules
npm install

cd ../dapps/o-dentity
rm package-lock.json
rm -rf node_modules
npm install

cd ../o-market
rm package-lock.json
rm -rf node_modules
npm install

cd ../o-wallet
rm package-lock.json
rm -rf node_modules
npm install

cd ../o-friends
rm package-lock.json
rm -rf node_modules
npm install

cd ../../libraries/o-circles-protocol
rm package-lock.json
rm -rf node_modules
npm install

cd ../../services/o-ipfs
rm package-lock.json
rm -rf node_modules
npm install

cd ../../o-design-system
rm package-lock.json
rm -rf node_modules
npm install

cd ../o-os
rm package-lock.json
rm -rf node_modules
npm install

cd ../..
rm package-lock.json
rm -rf node_modules
npm install
rm package-lock.json
rm -rf node_modules
npm install

echo "° ready"