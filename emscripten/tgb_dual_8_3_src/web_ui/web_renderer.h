#include "../gb_core/renderer.h"
#include <stdio.h>
#include <vector>

using namespace std;

struct col_filter{
	int r_def,g_def,b_def;
	int r_div,g_div,b_div;
	int r_r,r_g,r_b;
	int g_r,g_g,g_b;
	int b_r,b_g,b_b;
};

class web_renderer : public renderer
{
	//friend short* __stdcall getSoundBytes();
public:
	web_renderer();
	~web_renderer();

	void reset();
	void refresh() {}
	void render_screen(byte *buf,int width,int height,int depth);
	word get_sensor(bool x_y) { return 0; }
	void output_log(char *mes,...);
	byte get_time(int type);
	void set_time(int type,byte dat);
	void set_bibrate(bool bibrate) {};

	word map_color(word gb_col);
	word unmap_color(word gb_col);
	int check_pad();
	void set_pad(int state);
	void set_fixed_time(dword time);

	void set_filter(col_filter *fil) { m_filter=*fil; };
private:
	int key_state;
	int cur_time;
	dword fixed_time;
	col_filter m_filter;
	
	int color_type;
};
