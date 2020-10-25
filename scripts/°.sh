if [ -z "$(ls -A o-os)" ]; then
    git clone https://github.com/omoearth/o-os.git o-os
else
   git fetch o-os
fi


if [ -z "$(ls -A dapps/o-dentity)" ]; then
    git clone https://github.com/omoearth/o-dapp-odentity.git dapps/o-dentity
else
    git fetch dapps/o-dentity
fi


if [ -z "$(ls -A o-circles-protocol)" ]; then
    git clone https://github.com/omoearth/o-circles-protocol.git o-circles-protocol
else
   git fetch o-circles-protocol
fi



if [ -z "$(ls -A dapps/o-market)" ]; then
    git clone https://github.com/omoearth/o-dapp-market.git dapps/o-market
else
    git fetch dapps/o-market
fi



if [ -z "$(ls -A dapps/o-wallet)" ]; then
    git clone https://github.com/omoearth/o-dapp-wallet.git dapps/o-wallet
else
    git fetch dapps/o-wallet
fi



if [ -z "$(ls -A services/o-ipfs)" ]; then
    git clone https://github.com/omoearth/o-service-ipfs.git services/o-ipfs  
else
    git fetch services/o-ipfs
fi


if [ -z "$(ls -A o-types)" ]; then
    git clone https://github.com/omoearth/o-types.git o-types  
else
    git fetch o-types
fi


if [ -z "$(ls -A -recycle)" ]; then
    git clone https://github.com/omoearth/-recycle.git o-recycle  
else
    git fetch o-types
fi

echo "° ready"