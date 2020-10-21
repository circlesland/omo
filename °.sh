if [ -z "$(ls -A °os)" ]; then
    git clone https://github.com/omoearth/o-os.git °os
else
   git fetch °os
fi



if [ -z "$(ls -A °circles-protocol)" ]; then
    git clone https://github.com/omoearth/o-circles-protocol.git °circles-protocol
else
   git fetch °circles-protocol
fi



if [ -z "$(ls -A °views)" ]; then
    git clone https://github.com/omoearth/o-views.git °views
else
   git fetch °views
fi



if [ -z "$(ls -A dapps/°dentity)" ]; then
    git clone https://github.com/omoearth/o-dapp-odentity.git dapps/°dentity
else
    git fetch dapps/°dentity
fi



if [ -z "$(ls -A dapps/°market)" ]; then
    git clone https://github.com/omoearth/o-dapp-market.git dapps/°market
else
    git fetch dapps/°market
fi



if [ -z "$(ls -A dapps/°wallet)" ]; then
    git clone https://github.com/omoearth/o-dapp-wallet.git dapps/°wallet
else
    git fetch dapps/°wallet
fi



if [ -z "$(ls -A services/°ipfs)" ]; then
    git clone https://github.com/omoearth/o-service-ipfs.git services/°ipfs  
else
    git fetch services/°ipfs
fi

echo "° ready"