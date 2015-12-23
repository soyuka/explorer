#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"

if [ ! -z $HOME ]; then
  config_path="$HOME/.config/explorer"
else
  config_path="$DIR"
fi

[ ! -d $config_path ] && mkdir -p $config_path
[ ! -f "$config_path/config.yml" ] && cp -R doc/examples/* $config_path

if [ -d $NVM_BIN ]; then
  ln -sf $DIR/bin/explorer $NVM_BIN/explorer
else
  echo "Failed to link binary. Add $DIR/bin to you PATH and run:"
  echo "explorer plugin install"
  exit 1
fi

echo "Updating plugins"
$DIR/bin/explorer plugin install

exit 0
