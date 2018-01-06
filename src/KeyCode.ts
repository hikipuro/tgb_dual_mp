export module KeyCode {
	export const Cancel = 3;
	
	export const Help = 6;

	export const Backspace = 8;
	export const Tab = 9;

	export const Clear = 12;
	export const Enter = 13;
	export const EnterSpecial = 14;

	export const Shift = 16;
	export const Control = 17;
	export const Alt = 18;
	export const Pause = 19;
	export const CapsLock = 20;
	export const Kana = 21;
	export const Eisu = 22;
	export const Junja = 23;
	export const Final = 24;
	export const Hanja = 25;

	export const Escape = 27;
	/** Henkan. */
	export const Convert = 28;
	/** Muhenkan. */
	export const NonConvert = 29;
	export const Accept = 30;
	export const ModeChange = 31;
	export const Space = 32;
	export const PageUp = 33;
	export const PageDown = 34;
	export const End = 35;
	export const Home = 36;
	export const Left = 37;
	export const Up = 38;
	export const Right = 39;
	export const Down = 40;
	export const Select = 41;
	export const Print = 42;
	export const Execute = 43;
	export const PrintScreen = 44;
	export const Insert = 45;
	export const Delete = 46;

	export const D0 = 48;
	export const D1 = 49;
	export const D2 = 50;
	export const D3 = 51;
	export const D4 = 52;
	export const D5 = 53;
	export const D6 = 54;
	export const D7 = 55;
	export const D8 = 56;
	export const D9 = 57;
	export const Colon2 = 58;
	export const SemiColon2 = 59;
	export const LessThan = 60;
	export const Equals = 61;
	export const GreaterThan = 62;
	export const QuestionMark = 63;
	export const Atmark = 64;
	export const A = 65;
	export const B = 66;
	export const C = 67;
	export const D = 68;
	export const E = 69;
	export const F = 70;
	export const G = 71;
	export const H = 72;
	export const I = 73;
	export const J = 74;
	export const K = 75;
	export const L = 76;
	export const M = 77;
	export const N = 78;
	export const O = 79;
	export const P = 80;
	export const Q = 81;
	export const R = 82;
	export const S = 83;
	export const T = 84;
	export const U = 85;
	export const V = 86;
	export const W = 87;
	export const X = 88;
	export const Y = 89;
	export const Z = 90;
	export const OSLeft = 91;
	export const OSRight = 92;
	export const ContextMenu = 93;

	export const Sleep = 95;
	export const Numpad0 = 96;
	export const Numpad1 = 97;
	export const Numpad2 = 98;
	export const Numpad3 = 99;
	export const Numpad4 = 100;
	export const Numpad5 = 101;
	export const Numpad6 = 102;
	export const Numpad7 = 103;
	export const Numpad8 = 104;
	export const Numpad9 = 105;
	export const NumpadMultiply = 106;
	export const NumpadAdd = 107;
	export const NumpadSeparator = 108;
	export const NumpadSubtract = 109;
	export const NumpadDecimal = 110;
	export const NumpadDevide = 111;
	export const F1 = 112;
	export const F2 = 113;
	export const F3 = 114;
	export const F4 = 115;
	export const F5 = 116;
	export const F6 = 117;
	export const F7 = 118;
	export const F8 = 119;
	export const F9 = 120;
	export const F10 = 121;
	export const F11 = 122;
	export const F12 = 123;
	export const F13 = 124;
	export const F14 = 125;
	export const F15 = 126;
	export const F16 = 127;
	export const F17 = 128;
	export const F18 = 129;
	export const F19 = 130;
	export const F20 = 131;
	export const F21 = 132;
	export const F22 = 133;
	export const F23 = 134;
	export const F24 = 135;

	export const NumLock = 144;
	export const ScrollLock = 145;
	
	export const Circumflex = 160;
	export const Exclamation = 161;
	export const DoubleQuote = 162;
	export const Hash = 163;
	export const Dollar = 164;
	export const Percent = 165;
	export const Ampersand = 166;
	export const Underscore2 = 167;
	export const OpenParen = 168;
	export const CloseParen = 169;
	export const Asterisk = 170;
	export const Plus = 171;
	export const Pipe = 172;
	export const HyphenMinus = 173;
	export const OpenCurlyBracket = 174;
	export const CloseCurlyBracket = 175;
	export const Tilde2 = 176;

	export const VolumeMute = 181;
	export const VolumeDown = 182;
	export const VolumeUp = 183;

	export const Colon = 186;
	export const SemiColon = 187;
	export const Comma = 188;
	export const Minus = 189;
	export const Period = 190;
	export const Slash = 191;
	export const BackQuote = 192;

	export const OpenBracket = 219;
	export const BackSlash = 220;
	export const CloseBracket = 221;
	export const Tilde = 222;

	export const Meta = 224;
	export const AltGr = 225;
	export const Underscore = 226;

	export const Eisuu = 240;

	export const HiraganaKatakana = 242;
	export const HankakuZenkaku = 243;
	export const HankakuZenkaku2 = 244;

	export function toString(keyCode: number): string {
		const map = [
			"", // [0]
			"", // [1]
			"", // [2]
			"Cancel", // [3]
			"", // [4]
			"", // [5]
			"Help", // [6]
			"", // [7]
			"Backspace", // [8]
			"Tab", // [9]
			"", // [10]
			"", // [11]
			"Clear", // [12]
			"Enter", // [13]
			"EnterSpecial", // [14]
			"", // [15]
			"Shift", // [16]
			"Control", // [17]
			"Alt", // [18]
			"Pause", // [19]
			"CapsLock", // [20]
			"Kana", // [21]
			"Eisu", // [22]
			"Junja", // [23]
			"Final", // [24]
			"Hanja", // [25]
			"", // [26]
			"Escape", // [27]
			"Convert", // [28]
			"NonConvert", // [29]
			"Accept", // [30]
			"ModeChange", // [31]
			"Space", // [32]
			"PageUp", // [33]
			"PageDown", // [34]
			"End", // [35]
			"Home", // [36]
			"ArrowLeft", // [37]
			"ArrowUp", // [38]
			"ArrowRight", // [39]
			"ArrowDown", // [40]
			"Select", // [41]
			"Print", // [42]
			"Execute", // [43]
			"PrintScreen", // [44]
			"Insert", // [45]
			"Delete", // [46]
			"", // [47]
			"0", // [48]
			"1", // [49]
			"2", // [50]
			"3", // [51]
			"4", // [52]
			"5", // [53]
			"6", // [54]
			"7", // [55]
			"8", // [56]
			"9", // [57]
			"Colon", // [58]
			"SemiColon", // [59]
			"LessThan", // [60]
			"Equals", // [61]
			"GreaterThan", // [62]
			"QuestionMark", // [63]
			"@", // [64]
			"A", // [65]
			"B", // [66]
			"C", // [67]
			"D", // [68]
			"E", // [69]
			"F", // [70]
			"G", // [71]
			"H", // [72]
			"I", // [73]
			"J", // [74]
			"K", // [75]
			"L", // [76]
			"M", // [77]
			"N", // [78]
			"O", // [79]
			"P", // [80]
			"Q", // [81]
			"R", // [82]
			"S", // [83]
			"T", // [84]
			"U", // [85]
			"V", // [86]
			"W", // [87]
			"X", // [88]
			"Y", // [89]
			"Z", // [90]
			"OSLeft", // [91] Windows Key (Windows) or Command Key (Mac)
			"OSRight", // [92]
			"ContextMenu", // [93]
			"", // [94]
			"Sleep", // [95]
			"Numpad0", // [96]
			"Numpad1", // [97]
			"Numpad2", // [98]
			"Numpad3", // [99]
			"Numpad4", // [100]
			"Numpad5", // [101]
			"Numpad6", // [102]
			"Numpad7", // [103]
			"Numpad8", // [104]
			"Numpad9", // [105]
			"Multiply", // [106]
			"Add", // [107]
			"Separator", // [108]
			"Subtract", // [109]
			"Decimal", // [110]
			"Devide", // [111]
			"F1", // [112]
			"F2", // [113]
			"F3", // [114]
			"F4", // [115]
			"F5", // [116]
			"F6", // [117]
			"F7", // [118]
			"F8", // [119]
			"F9", // [120]
			"F10", // [121]
			"F11", // [122]
			"F12", // [123]
			"F13", // [124]
			"F14", // [125]
			"F15", // [126]
			"F16", // [127]
			"F17", // [128]
			"F18", // [129]
			"F19", // [130]
			"F20", // [131]
			"F21", // [132]
			"F22", // [133]
			"F23", // [134]
			"F24", // [135]
			"", // [136]
			"", // [137]
			"", // [138]
			"", // [139]
			"", // [140]
			"", // [141]
			"", // [142]
			"", // [143]
			"NumLock", // [144]
			"ScrollLock", // [145]
			"WIN_OEM_FJ_JISHO", // [146]
			"WIN_OEM_FJ_MASSHOU", // [147]
			"WIN_OEM_FJ_TOUROKU", // [148]
			"WIN_OEM_FJ_LOYA", // [149]
			"WIN_OEM_FJ_ROYA", // [150]
			"", // [151]
			"", // [152]
			"", // [153]
			"", // [154]
			"", // [155]
			"", // [156]
			"", // [157]
			"", // [158]
			"", // [159]
			"Circumflex", // [160]
			"Exclamation", // [161]
			"DoubleQuote", // [162]
			"Hash", // [163]
			"Dollar", // [164]
			"Percent", // [165]
			"Ampersand", // [166]
			"Underscore", // [167]
			"OpenParen", // [168]
			"CloseParen", // [169]
			"Asterisk", // [170]
			"Plus", // [171]
			"Pipe", // [172]
			"HyphenMinus", // [173]
			"OpenCurlyBracket", // [174]
			"CloseCurlyBracket", // [175]
			"Tilde", // [176]
			"", // [177]
			"", // [178]
			"", // [179]
			"", // [180]
			"VolumeMute", // [181]
			"VolumeDown", // [182]
			"VolumeUp", // [183]
			"", // [184]
			"", // [185]
			"Colon", // [186]
			"SemiColon", // [187]
			"Comma", // [188]
			"Minus", // [189]
			"Period", // [190]
			"Slash", // [191]
			"BackQuote", // [192]
			"", // [193]
			"", // [194]
			"", // [195]
			"", // [196]
			"", // [197]
			"", // [198]
			"", // [199]
			"", // [200]
			"", // [201]
			"", // [202]
			"", // [203]
			"", // [204]
			"", // [205]
			"", // [206]
			"", // [207]
			"", // [208]
			"", // [209]
			"", // [210]
			"", // [211]
			"", // [212]
			"", // [213]
			"", // [214]
			"", // [215]
			"", // [216]
			"", // [217]
			"", // [218]
			"OpenBracket", // [219]
			"BackSlash", // [220]
			"CloseBracket", // [221]
			"Tilde", // [222]
			"Underscore", // [223]
			"Meta", // [224]
			"AltGr", // [225]
			"", // [226]
			"WIN_ICO_HELP", // [227]
			"WIN_ICO_00", // [228]
			"", // [229]
			"WIN_ICO_CLEAR", // [230]
			"", // [231]
			"", // [232]
			"WIN_OEM_RESET", // [233]
			"WIN_OEM_JUMP", // [234]
			"WIN_OEM_PA1", // [235]
			"WIN_OEM_PA2", // [236]
			"WIN_OEM_PA3", // [237]
			"WIN_OEM_WSCTRL", // [238]
			"WIN_OEM_CUSEL", // [239]
			"WIN_OEM_ATTN", // [240]
			"WIN_OEM_FINISH", // [241]
			"WIN_OEM_COPY", // [242]
			"WIN_OEM_AUTO", // [243]
			"WIN_OEM_ENLW", // [244]
			"WIN_OEM_BACKTAB", // [245]
			"ATTN", // [246]
			"CRSEL", // [247]
			"EXSEL", // [248]
			"EREOF", // [249]
			"PLAY", // [250]
			"ZOOM", // [251]
			"", // [252]
			"PA1", // [253]
			"WIN_OEM_CLEAR", // [254]
			"" // [255]
		];
		return map[keyCode];
	}
}