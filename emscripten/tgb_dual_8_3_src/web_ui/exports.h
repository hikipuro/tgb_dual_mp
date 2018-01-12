#ifndef EXPORTS_H
#define EXPORTS_H

#include <emscripten.h>

#ifdef __cplusplus
	extern "C" {
#endif

EMSCRIPTEN_KEEPALIVE void loadRom(int size, unsigned char* dat, int sramSize, unsigned char* sram);
EMSCRIPTEN_KEEPALIVE void nextFrame();
EMSCRIPTEN_KEEPALIVE void initTgbDual();
EMSCRIPTEN_KEEPALIVE void freeTgbDual();
EMSCRIPTEN_KEEPALIVE void reset();
EMSCRIPTEN_KEEPALIVE void saveState(char *path);
EMSCRIPTEN_KEEPALIVE void restoreState(char *path);
EMSCRIPTEN_KEEPALIVE void setSkip(int frame);
EMSCRIPTEN_KEEPALIVE byte* getSram();
EMSCRIPTEN_KEEPALIVE void saveSram(char *path);

EMSCRIPTEN_KEEPALIVE char* getCartName();
EMSCRIPTEN_KEEPALIVE int getCartType();
EMSCRIPTEN_KEEPALIVE byte getRomSize();
EMSCRIPTEN_KEEPALIVE byte getRamSize();
EMSCRIPTEN_KEEPALIVE bool getCheckSum();
EMSCRIPTEN_KEEPALIVE int getGBType();

EMSCRIPTEN_KEEPALIVE unsigned char* getBytes();
EMSCRIPTEN_KEEPALIVE short* getSoundBytes(int size);
EMSCRIPTEN_KEEPALIVE void setKeys(int down, int up, int left, int right, int a, int b, int select, int start);

EMSCRIPTEN_KEEPALIVE void enableSoundChannel(int ch, bool enable);
EMSCRIPTEN_KEEPALIVE void enableSoundEcho(bool enable);
EMSCRIPTEN_KEEPALIVE void enableSoundLowPass(bool enable);

EMSCRIPTEN_KEEPALIVE void enableScreenLayer(int layer, bool enable);

EMSCRIPTEN_KEEPALIVE void setGBType(int type);

#ifdef __cplusplus
	}
#endif

#endif
