#version 300 es

precision highp float;

uniform sampler2D color_sampler;

in vec2 var_texCoord;

out vec4 screen_Color;
void main()
{  
     
    screen_Color = texture(color_sampler, var_texCoord);

}