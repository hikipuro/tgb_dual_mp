project(tgb_dual)
include (CheckCXXCompilerFlag)
cmake_minimum_required(VERSION 2.6 FATAL_ERROR)

set(tgb_dual_SRCS gb_core/apu.cpp
				gb_core/cheat.cpp
				gb_core/cpu.cpp
				gb_core/gb.cpp
				gb_core/lcd.cpp
				gb_core/mbc.cpp
				gb_core/rom.cpp
				gbr_interface/gbr.cpp
				web_ui/dmy_renderer.cpp
				web_ui/glue.cpp
				web_ui/web_renderer.cpp
				)

set(EMCC_LINKER_FLAGS "-Oz --js-library ../api.js --pre-js ../pre.js --post-js ../post.js -s ASSERTIONS=1 -s WASM=1 -s FORCE_FILESYSTEM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='[\"ccall\", \"cwrap\", \"setValue\", \"getValue\", \"Pointer_stringify\", \"UTF8ToString\", \"stringToUTF8\", \"UTF16ToString\", \"stringToUTF16\", \"UTF32ToString\", \"stringToUTF32\", \"intArrayFromString\", \"intArrayToString\", \"writeStringToMemory\", \"writeArrayToMemory\", \"writeAsciiToMemory\", \"addRunDependency\", \"removeRunDependency\", \"stackTrace\"]'")
set(CMAKE_REQUIRED_FLAGS "${EMCC_LINKER_FLAGS}")
add_executable(tgb_dual ${tgb_dual_SRCS})
set_target_properties(tgb_dual PROPERTIES LINK_FLAGS "${EMCC_LINKER_FLAGS}")
