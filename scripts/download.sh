#!/usr/bin/env sh

red() {
  echo "\033[31m$1\033[39m"
}

cyan() {
  echo "\033[36m$1\033[39m"
}

version="${1:-latest}"
link="https://github.com/jjorissen52/env-vault/releases/${version}/download"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
   link="${link}/ev-linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
   link="${link}/ev-macos"
elif [[ "$OSTYPE" == "cygwin" ]]; then
   link="${link}/ev-linux"
elif [[ "$OSTYPE" == "msys" ]]; then
   link="${link}/ev-win.exe"
elif [[ "$OSTYPE" == "win32" ]]; then
   link="${link}/ev-win.exe"
else
   red "unknown platform ${OSTYPE}; download may not work as expected."
   link="${link}/ev-linux"
fi

file_name="$(basename "${link}")"
destination="${2:-"${PWD}/${file_name}"}"

cyan "Downloading ${link} to ${destination}..."
wget -q --show-progress -O "${destination}" "${link}"
chmod +x "${destination}"

cyan "You should move ${destination} somewhere on your path, such as /usr/local/bin/"
