#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ ! -z $HOME ]; then
  config_path="$HOME/.config/explorer"
else
  config_path="./"
fi

[ ! -d $config_path ] && mkdir -p $config_path
cp -R doc/examples/ $config_path

[ -d $NVM_BIN ] && ln -sf $DIR/bin/explorer $NVM_BIN/explorer
[ ! -d $NVM_BIN ] && echo "Failed to link binary. Add $DIR/bin to you PATH"

echo "Updating plugins"
$DIR/bin/explorer plugin install

exit 0
