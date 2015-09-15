#!/bin/bash
if [ ! -z $HOME ]; then
  config_path="$HOME/.config/explorer"
else
  config_path="./"
fi

[ ! -d $config_path ] && mkdir -p $config_path
cp -R doc/examples/ $config_path
# [ ! -f $config_path/data/users ] && cp ./doc/examples/data/users $config_path/data/users
# [ ! -f $config_path/config.yml ] && cp ./doc/examples/config.example.yml $config_path/config.yml
# [ ! -d $config_path/certs ] && cp -r ./doc/examples/certs $config_path/certs
# [ ! -d $config_path/trash ] && mkdir $config_path/trash

[ -d $NVM_BIN ] && ln -sf $DIR/bin/explorer $NVM_BIN/explorer
[ ! -d $NVM_BIN ] && echo "Failed to link binary. Add $DIR/bin to you PATH"

exit 0
