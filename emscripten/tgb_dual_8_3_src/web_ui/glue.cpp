#include <list>
#include "../gb_core/gb.h"
#include "../gbr_interface/gbr.h"
#include "dmy_renderer.h"
#include "web_renderer.h"
#include "exports.h"

typedef	unsigned char BYTE;
typedef	unsigned short WORD;
typedef	unsigned long DWORD;

#ifdef __cplusplus
	extern "C" {
#endif

static int rom_size_tbl[]={2,4,8,16,32,64,128,256,512};

static char tmp_sram_name[2][256];
static const char mbc_types[0x101][40]={"ROM Only","ROM + MBC1","ROM + MBC1 + RAM","ROM + MBC1 + RAM + Battery","Unknown","ROM + MBC2","ROM + MBC2 + Battery","Unknown",
									"ROM + RAM" ,"ROM + RAM + Battery","Unknown","ROM + MMM01","ROM + MMM01 + SRAM","ROM + MMM01 + Battery","Unknown",
									"ROM + MBC3 + TIMER + Battery","ROM + MBC3 + TIMER + RAM + Battery","ROM + MBC3","ROM + MBC3 + RAM","ROM + MBC3 + RAM + Battery",
									"Unknown","Unknown","Unknown","Unknown","Unknown",
									"ROM + MBC5","ROM + MBC5 + RAM","ROM + MBC5 + RAM + Battery","ROM + MBC5 + RUMBLE","ROM + MBC5 + RUMBLE + SRAM","ROM + MBC5 + RUMBLE + SRAM + Battery",
									"Pocket Camera","","","MBC7? + EEPROM + MOTIONSENSOR",//#22
									"","","","","","","","","","","","","",//#2F
									"","","","","","","","","","","","","","","","",//#3F
									"","","","","","","","","","","","","","","","",//#4F
									"","","","","","","","","","","","","","","","",//#5F
									"","","","","","","","","","","","","","","","",//#6F
									"","","","","","","","","","","","","","","","",//#7F
									"","","","","","","","","","","","","","","","",//#8F
									"","","","","","","","","","","","","","","","",//#9F
									"","","","","","","","","","","","","","","","",//#AF
									"","","","","","","","","","","","","","","","",//#BF
									"","","","","","","","","","","","","","","","",//#CF
									"","","","","","","","","","","","","","","","",//#DF
									"","","","","","","","","","","","","","","","",//#EF
									"","","","","","","","","","","","","","Bandai TAMA5","Hudson HuC-3","Hudson HuC-1",//#FF
									"mmm01" // 逃げ
};
static byte org_gbtype[2];

//#define hide

static bool sram_transfer_rest=false;
static bool b_running=true;

gb *g_gb[2];
gbr *g_gbr;
web_renderer *render[2];
//dx_renderer *render[2];
//#ifndef hide
//dx_renderer *dmy_render;
//#else
//dmy_renderer *dmy_render;
//#endif
//setting *config;
std::list<char*> mes_list,chat_list;

struct netplay_data{
	int key;
	DWORD time;
};
//typedef netplay<netplay_data> tgb_netplay;
//tgb_netplay *net=NULL;
int sended=0;

int cur_mode;
enum mode{
	UNLOADED,
	NORMAL_MODE,
	GBR_MODE,
	NETWORK_PREPARING,
	NETWORK_MODE,
};

FILE* log_file;


//	int cart_type;
//	byte rom_size;
//	byte ram_size;
//	bool check_sum;
int gb_type = 0;

char* getCartName() {
	return g_gb[0]->get_rom()->get_info()->cart_name;
}

int getCartType() {
	return g_gb[0]->get_rom()->get_info()->cart_type;
}

byte getRomSize() {
	return g_gb[0]->get_rom()->get_info()->rom_size;
}

byte getRamSize() {
	return g_gb[0]->get_rom()->get_info()->ram_size;
}

bool getCheckSum() {
	return g_gb[0]->get_rom()->get_info()->check_sum;
}

int getGBType() {
	return g_gb[0]->get_rom()->get_info()->gb_type;
}

void initTgbDual()
{
	//EM_ASM(
	//	console.log("###  *** initTgbDual ****");
	//	Module.print("I received: ");
	//);

	render[0] = new web_renderer();
	
	/*
	render[0]=new dx_renderer(hWnd,hInst);
	render[1]=NULL;
	dmy_render=NULL;
	g_gb[0]=g_gb[1]=NULL;
	render[0]->set_vsync(config->vsync);

	render[0]->set_render_pass(config->render_pass);
	render[0]->show_fps(config->show_fps);

	*/
	cur_mode=UNLOADED;
}

void freeTgbDual() {
	if (g_gb[0]){
		delete g_gb[0];
		g_gb[0] = 0;
	}
	if (render[0]) {
		delete render[0];
		render[0] = 0;
	}
}

void reset() {
	printf("********************* reset\n");
	g_gb[0]->reset();
	//g_gb[0]->get_renderer()->reset();
}

void saveState(char *path) {
	printf("path: %s\n", path);
	FILE *file = fopen(path, "w");
	g_gb[0]->save_state(file);
	fclose(file);
}

void restoreState(char *path) {
	printf("path: %s\n", path);
	FILE *file = fopen(path, "r");
	g_gb[0]->restore_state(file);
	fclose(file);
}

void setSkip(int frame) {
	g_gb[0]->set_skip(frame);
}

byte* getSram() {
	return g_gb[0]->get_rom()->get_sram();
}

void saveSram(char *path) {
	BYTE *buf = g_gb[0]->get_rom()->get_sram();
	int size = g_gb[0]->get_rom()->get_info()->ram_size;
	int num = 0;
	//if (strstr(tmp_sram_name[num],".srt"))
	//	return;

	int sram_tbl[]={1,1,1,4,16,8};
	//char cur_di[256],sv_dir[256];
	//GetCurrentDirectory(256,cur_di);
	//config->get_save_dir(sv_dir);
	//SetCurrentDirectory(sv_dir);
	FILE *fs=fopen(path,"wb");
	fwrite(buf,1,0x2000*sram_tbl[size],fs);
	if ((g_gb[num]->get_rom()->get_info()->cart_type>=0x0f)&&(g_gb[num]->get_rom()->get_info()->cart_type<=0x13)){
		int tmp=render[0]->get_timer_state();
		fwrite(&tmp,4,1,fs);
	}
	fclose(fs);
	//SetCurrentDirectory(cur_di);
}

void loadRom(int size, unsigned char* dat, int sramSize, unsigned char* sram)
{
	printf("################# loadRom\n");
	int num = 0;
	//int size;
	//BYTE *dat;
	
	if (!g_gb[num]){
		g_gb[num]=new gb(render[num],true,(num)?false:true);
		g_gb[num]->set_target(NULL);

		if (g_gb[num?0:1]){
			g_gb[0]->set_target(g_gb[1]);
			g_gb[1]->set_target(g_gb[0]);
		}

		//if (config->sound_enable[4]){
		if (false){
			//g_gb[num]->get_apu()->get_renderer()->set_enable(0,config->sound_enable[0]?true:false);
			//g_gb[num]->get_apu()->get_renderer()->set_enable(1,config->sound_enable[1]?true:false);
			//g_gb[num]->get_apu()->get_renderer()->set_enable(2,config->sound_enable[2]?true:false);
			//g_gb[num]->get_apu()->get_renderer()->set_enable(3,config->sound_enable[3]?true:false);
		}
		else{
			g_gb[num]->get_apu()->get_renderer()->set_enable(0,true);
			g_gb[num]->get_apu()->get_renderer()->set_enable(1,true);
			g_gb[num]->get_apu()->get_renderer()->set_enable(2,true);
			g_gb[num]->get_apu()->get_renderer()->set_enable(3,true);
			
			/*
				g_gb[num]->get_lcd()->set_enable(0,true);
				g_gb[num]->get_lcd()->set_enable(1,true);
				g_gb[num]->get_lcd()->set_enable(2,true);
				g_gb[num]->get_lcd()->set_enable(3,true);
			*/
		}
		g_gb[num]->get_apu()->get_renderer()->set_echo(true);
		g_gb[num]->get_apu()->get_renderer()->set_lowpass(true);
	}
	else{
		//if (g_gb[num]->get_rom()->has_battery())
		//	save_sram(g_gb[num]->get_rom()->get_sram(),g_gb[num]->get_rom()->get_info()->ram_size,num);
	}
	
	/*
	col_filter cof;
	cof.r_def=0;
	cof.g_def=0;
	cof.b_def=0;
	cof.r_div=256;
	cof.g_div=256;
	cof.b_div=256;
	cof.r_r=256;
	cof.r_g=0;
	cof.r_b=0;
	cof.g_r=0;
	cof.g_g=256;
	cof.g_b=0;
	cof.b_r=0;
	cof.b_g=0;
	cof.b_b=256;
	render[num]->set_filter(&cof);
	*/
	
	//g_gb[0]->refresh_pal();
	
	int tbl_ram[]={1,1,1,4,16,8};//0と1は保険
	BYTE *ram;
	int ram_size=0x2000*tbl_ram[dat[0x149]];
	ram=(BYTE*)malloc(ram_size);

	if (sramSize <= 0) {
		memset(ram,0,ram_size);
	} else {
		memcpy(ram, sram, sramSize);
	}
	
	//printf("ram_size: %04x\n", ram_size);
	
	org_gbtype[num]=dat[0x143]&0x80;
	
	if (gb_type == 1) {
		dat[0x143] &= 0x7f;
	} else if (gb_type >= 3) {
		dat[0x143] |= 0x80;
	}
	
	//g_gb[num]->set_use_gba(false);
	g_gb[num]->load_rom(dat,size,ram,ram_size);
	
	//char pb[256];
	//sprintf(pb,"Load ROM \"test\" slot[%d] :\ntype-%d:%s\nsize=%dKB : name=%s\n\n",num+1,g_gb[num]->get_rom()->get_info()->cart_type,mbc_types[g_gb[num]->get_rom()->get_info()->cart_type],size/1024,g_gb[num]->get_rom()->get_info()->cart_name);
	
	//free(dat);
	//printf("%s\n", pb);
	
	/*
	FILE *file;
	int size;
	BYTE *dat;
	char *p=buf;

	p=strrchr(buf,'.');
	if (p)
		while(*p!='\0') *(p++)=tolower(*p);

	if (strstr(buf,".gbr")){
		file=fopen(buf,"rb");
		if (!file) return false;

		fseek(file,0,SEEK_END);
		size=ftell(file);
		fseek(file,0,SEEK_SET);
		dat=(BYTE*)malloc(size);
		fread(dat,1,size,file);
		fclose(file);

		if (g_gb[0]){
			if (g_gb[0]->get_rom()->has_battery())
				save_sram(g_gb[0]->get_rom()->get_sram(),g_gb[0]->get_rom()->get_info()->ram_size,0);
			delete g_gb[0];
			g_gb[0]=NULL;
		}
		if (g_gb[1]){
			if (g_gb[1]->get_rom()->has_battery())
				save_sram(g_gb[1]->get_rom()->get_sram(),g_gb[1]->get_rom()->get_info()->ram_size,1);
			delete g_gb[1];
			g_gb[1]=NULL;
			delete render[1];
			render[1]=NULL;
		}
		if (g_gbr){
			FreeLibrary(h_gbr_dll);
			delete g_gbr;
			g_gbr=NULL;
		}

		char cur_di[256],dll_dir[256],tmp[256];
		GetCurrentDirectory(256,cur_di);
		config->get_dev_dir(dll_dir);
		SetCurrentDirectory(dll_dir);

		gbr_procs *procs;
		h_gbr_dll=LoadLibrary("tgbr_dll.dll");
		if (h_gbr_dll){
			procs=((gbr_procs*(*)())GetProcAddress(h_gbr_dll,"get_interface"))();
			g_gbr=new gbr(render[0],procs);
			g_gbr->load_rom(dat,size);

			if (config->sound_enable[4]){
				g_gbr->set_enable(0,config->sound_enable[0]?true:false);
				g_gbr->set_enable(1,config->sound_enable[1]?true:false);
				g_gbr->set_enable(2,config->sound_enable[2]?true:false);
				g_gbr->set_enable(3,config->sound_enable[3]?true:false);
			}
			else{
				g_gbr->set_enable(0,false);
				g_gbr->set_enable(1,false);
				g_gbr->set_enable(2,false);
				g_gbr->set_enable(3,false);
			}
			g_gbr->set_effect(1,config->b_echo);
			g_gbr->set_effect(0,config->b_lowpass);

			strcpy(tmp_sram_name[0],buf);

			SetWindowText(hWnd,buf);
			sprintf(tmp,"Load GBR \"%s\" \n\n",buf);
			SendMessage(hWnd,WM_OUTLOG,0,(LPARAM)tmp);
		}
		else{
			MessageBox(hWnd,"tgbr_dll.dllが存在しません。このファイルは実行できません。","TGB Dual Notice",MB_OK);
		}
		SetCurrentDirectory(cur_di);

		return true;
	}
	else if (strstr(buf,".gb")||strstr(buf,".gbc")){
		file=fopen(buf,"rb");
		if (!file) return false;
		fseek(file,0,SEEK_END);
		size=ftell(file);
		fseek(file,0,SEEK_SET);
		dat=(BYTE*)malloc(size);
		fread(dat,1,size,file);
		fclose(file);
	}
	else
		if (!(dat=load_archive(buf,&size)))
			return false;

	if ((num==1)&&(!render[1])){
		render[1]=new dx_renderer(hWnd_sub,hInstance);
		render[1]->set_render_pass(config->render_pass);
		load_key_config(1);
	}
	if (!g_gb[num]){
		g_gb[num]=new gb(render[num],true,(num)?false:true);
		g_gb[num]->set_target(NULL);

		if (g_gb[num?0:1]){
			g_gb[0]->set_target(g_gb[1]);
			g_gb[1]->set_target(g_gb[0]);
		}

		if (config->sound_enable[4]){
			g_gb[num]->get_apu()->get_renderer()->set_enable(0,config->sound_enable[0]?true:false);
			g_gb[num]->get_apu()->get_renderer()->set_enable(1,config->sound_enable[1]?true:false);
			g_gb[num]->get_apu()->get_renderer()->set_enable(2,config->sound_enable[2]?true:false);
			g_gb[num]->get_apu()->get_renderer()->set_enable(3,config->sound_enable[3]?true:false);
		}
		else{
			g_gb[num]->get_apu()->get_renderer()->set_enable(0,false);
			g_gb[num]->get_apu()->get_renderer()->set_enable(1,false);
			g_gb[num]->get_apu()->get_renderer()->set_enable(2,false);
			g_gb[num]->get_apu()->get_renderer()->set_enable(3,false);
		}
		g_gb[num]->get_apu()->get_renderer()->set_echo(config->b_echo);
		g_gb[num]->get_apu()->get_renderer()->set_lowpass(config->b_lowpass);
	}
	else{
		if (g_gb[num]->get_rom()->has_battery())
			save_sram(g_gb[num]->get_rom()->get_sram(),g_gb[num]->get_rom()->get_info()->ram_size,num);
	}
	if (g_gbr){
		FreeLibrary(h_gbr_dll);
		delete g_gbr;
		g_gbr=NULL;
	}

	int tbl_ram[]={1,1,1,4,16,8};//0と1は保険
	char sram_name[256],cur_di[256],sv_dir[256];
	BYTE *ram;
	int ram_size=0x2000*tbl_ram[dat[0x149]];
	char *suffix=num?".sa2":".sav";
	{
		char *p=(char*)_mbsrchr((unsigned char*)buf,(unsigned char)'\\');
		if (!p) p=buf; else p++;
		strcpy(sram_name,p);
		p=(char*)_mbsrchr((unsigned char*)sram_name,(unsigned char)'.');
		if (p) strcpy(p,suffix);
		else strcat(sram_name,suffix);
	}
	GetCurrentDirectory(256,cur_di);
	config->get_save_dir(sv_dir);
	SetCurrentDirectory(sv_dir);

	{
		char tmp_sram[256];
		strcpy(tmp_sram,sram_name);

		// そのまま、先頭のピリオドから拡張子に、さらにそれを拡張子RAM化、の3通りしらべないかん…
		int i;
		for (i=0;i<3;i++){
			if (i==1) strcpy(strstr(tmp_sram,"."),suffix);
			else if (i==2) strcpy(strstr(tmp_sram,"."),num?".ra2":"ram");

			FILE *fs=fopen(tmp_sram,"rb");
			if (fs){
				ram=(BYTE*)malloc(ram_size);
				fread(ram,1,ram_size,fs);
				fseek(fs,0,SEEK_END);
				if (ftell(fs)&0xff){
					int tmp;
					fseek(fs,-4,SEEK_END);
					fread(&tmp,4,1,fs);
					if (render[num])
						render[num]->set_timer_state(tmp);
				}
				fclose(fs);
				break;
			}
		}
		if (i==3){
			ram=(BYTE*)malloc(ram_size);
			memset(ram,0,ram_size);
		}
	}
	strcpy(tmp_sram_name[num],sram_name);

	SetCurrentDirectory(cur_di);

	org_gbtype[num]=dat[0x143]&0x80;

	if (config->gb_type==1)
		dat[0x143]&=0x7f;
	else if (config->gb_type>=3)
		dat[0x143]|=0x80;

	g_gb[num]->set_use_gba(config->gb_type==0?config->use_gba:(config->gb_type==4?true:false));
	g_gb[num]->load_rom(dat,size,ram,ram_size);

	free(dat);
	free(ram);

	char pb[256];
	sprintf(pb,"Load ROM \"%s\" slot[%d] :\ntype-%d:%s\nsize=%dKB : name=%s\n\n",buf,num+1,g_gb[num]->get_rom()->get_info()->cart_type,mbc_types[g_gb[num]->get_rom()->get_info()->cart_type],size/1024,g_gb[num]->get_rom()->get_info()->cart_name);
	SendMessage(hWnd,WM_OUTLOG,0,(LPARAM)pb);


	if (num==0)
		SetWindowText(hWnd,g_gb[num]->get_rom()->get_info()->cart_name);
	else
		SetWindowText(hWnd_sub,g_gb[num]->get_rom()->get_info()->cart_name);

	return true;
	*/
}


void nextFrame()
{
	//if (GetActiveWindow()) render[0]->enable_check_pad();
	//else render[0]->disable_check_pad();
	
	//if (g_gb[0])
	//	printf("%06x\n", g_gb[0]->get_cpu()->get_regs()->PC);

	// とりあえず実行
	for (int line=0;line<154;line++){
		if (g_gb[0])
			g_gb[0]->run();
		//if (g_gb[1])
		//	g_gb[1]->run(); 
	}
	//if (g_gbr)
	//	g_gbr->run();

	// フレームスキップ周りの処理
	/*
	key_dat tmp_key;
	tmp_key.device_type=config->fast_forwerd[0];
	tmp_key.key_code=config->fast_forwerd[1];
	bool fast=render[0]->check_press(&tmp_key);
	int frame_skip=fast?config->fast_frame_skip:config->frame_skip;
	int fps=fast?config->fast_virtual_fps:config->virtual_fps;
	bool limit=fast?config->fast_speed_limit:config->speed_limit;

	if (g_gb[0]) g_gb[0]->set_skip(frame_skip);
	if (render[0]) render[0]->set_mul(frame_skip+1);
	if (limit) elapse_time(fps);
	*/
	//if (g_gb[0]) g_gb[0]->set_skip(0);
}

void enableSoundChannel(int ch, bool enable) {
	if (ch < 0 || ch > 3) {
		return;
	}
	g_gb[0]->get_apu()->get_renderer()->set_enable(ch, enable);
}

void enableSoundEcho(bool enable) {
	g_gb[0]->get_apu()->get_renderer()->set_echo(enable);
}

void enableSoundLowPass(bool enable) {
	g_gb[0]->get_apu()->get_renderer()->set_lowpass(enable);
}

void enableScreenLayer(int layer, bool enable) {
	if (layer < 0 || layer > 2) {
		return;
	}
	g_gb[0]->get_lcd()->set_enable(layer, enable);
}

void setGBType(int type) {
	// Auto:0, GB:1, GBC:3, GBA:4
	if (type < 0 || type > 4) {
		return;
	}
	gb_type = type;
}

#ifdef __cplusplus
	}
#endif