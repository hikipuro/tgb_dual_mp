#!/bin/sh

SrcDir="../tgb_dual_8_3_src/"
BuildDir="build"

if [ "$1" = "clean" ]; then
	echo "Clean tgb_dual"
	rm -rf "./$BuildDir"
	exit 0
fi

echo "Build tgb_dual"

command -v emconfigure >/dev/null 2>&1 || { echo >&2 "emconfigure not found. Aborting."; exit 1; }
command -v emmake >/dev/null 2>&1 || { echo >&2 "emmake not found. Aborting."; exit 1; }

if [ ! -d "$BuildDir" ]; then
	mkdir $BuildDir
fi

cd $BuildDir
emconfigure cmake $SrcDir
emmake make

cd ..
cp $BuildDir/tgb_dual.js ../html
#cp $BuildDir/tgb_dual.js.mem ../html
cp $BuildDir/tgb_dual.wasm ../html
